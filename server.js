console.log("\x1Bc");

const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db/db");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const bc = require("./config/bcrypt");

// *****************************************************************************
// middleware
// *****************************************************************************

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({ extended: false }));

app.engine("handlebars", hb({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use("/favicon.ico", (req, res) => {
    res.sendStatus(204);
});

app.use(
    cookieSession({
        secret: `...my secret cookie session :)`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(csurf());
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    res.locals.logged = req.session.user || false;
    next();
});

// *****************************************************************************
// global variables
// *****************************************************************************

//

// *****************************************************************************
// handy functions
// *****************************************************************************

function checkForLog(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

function checkForSig(req, res, next) {
    if (!req.session.user) {
        // unlogged user
        res.redirect("/login");
    }
    // logged user
    else {
        db.getSignature(req.session.user.id)
            //
            .then(result => {
                // signed petition
                if (result) {
                    if (req.url === "/petition") {
                        res.redirect("/thanks");
                    } else {
                        next();
                    }
                    // unsigned petiton
                } else {
                    if (req.url !== "/petition") {
                        res.redirect("/petition");
                    } else {
                        next();
                    }
                }
            });
    }
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// *****************************************************************************
// get routes
// *****************************************************************************

app.get("/", (req, res) => {
    res.render("home", {
        petitionFlag: false
    });
});

app.get("/register", (req, res) => {
    res.render("register", {
        petitionFlag: false
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        petitionFlag: false
    });
});

app.get("/petition", checkForSig, (req, res) => {
    res.render("petition", {
        firstName: req.session.user.first_name,
        lastName: req.session.user.last_name,
        petitionFlag: false
    });
});

app.get("/profile", checkForLog, (req, res) => {
    res.render("profile", {
        firstName: req.session.user.first_name,
        petitionFlag: false
    });
});

app.get("/profile/edit", checkForLog, (req, res) => {
    db.getProfile(req.session.user.id).then(userProfile => {
        res.render("edit", {
            userProfile: userProfile,
            petitionFlag: false
        });
    });
});

app.get("/list", checkForSig, (req, res) => {
    db.getNumber().then(numSigners => {
        db.getSigners().then(listSigners => {
            res.render("list", {
                listSigners: listSigners,
                numSigners: numSigners,
                petitionFlag: true
            });
        });
    });
});

app.get("/list/:city", checkForSig, (req, res) => {
    db.getCity(capitalize(req.params.city))
        .then(result => {
            res.render("city", {
                listSigners: result,
                city: capitalize(req.params.city),
                petitionFlag: true
            });
        })
        .catch(err => {
            res.render("city", {
                errFlag: true,
                err: err
            });
        });
});

app.get("/thanks", checkForSig, (req, res) => {
    db.getSignature(req.session.user.id).then(result => {
        db.getNumber()
            .then(numSigners => {
                res.render("thanks", {
                    firstName: req.session.user.first_name,
                    numSigners: numSigners,
                    signature: result.signature,
                    petitionFlag: true
                });
            })
            .catch(err => {
                res.render("home", {
                    errFlag: true,
                    err: err
                });
            });
    });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.locals.logged = false;
    res.render("home", {
        petitionFlag: false,
        loggedout: true
    });
});

app.get("*", (req, res) => {
    res.status(404);
    res.render("fnf");
});

// *****************************************************************************
// post routes
// *****************************************************************************

app.post("/register", (req, res) => {
    db.getEmail(req.body.email)
        .then(() => {
            //
            bc.hashPassword(req.body.password)
                //
                .then(hashedPassword => {
                    db.insertUser(
                        req.body.firstname,
                        req.body.lastname,
                        req.body.email,
                        hashedPassword
                    )
                        .then(registeredUser => {
                            req.session.user = registeredUser;
                            res.redirect("/profile");
                        })
                        .catch(falseErr => {
                            console.log(falseErr.detail);
                            res.render("register", {
                                falseFlag: true,
                                falseErr: "All fields are required!"
                            });
                        });
                });
        })
        .catch(err => {
            res.render("register", {
                falseFlag: true,
                falseErr: err
            });
        });
});

app.post("/login", (req, res) => {
    db.getPassword(req.body.email)
        .then(hashedPassword => {
            bc.checkPassword(req.body.password, hashedPassword)
                .then(checkedPassword => {
                    if (checkedPassword) {
                        db.getUser(req.body.email)
                            //
                            .then(loggedUser => {
                                req.session.user = loggedUser;
                                res.redirect("/petition");
                            });
                    } else {
                        throw new Error("Password doesn't match!");
                    }
                })
                .catch(falseErr => {
                    res.render("login", {
                        falseFlag: true,
                        falseErr: falseErr
                    });
                });
        })
        .catch(falseErr => {
            res.render("login", {
                falseFlag: true,
                falseErr: falseErr
            });
        });
});

app.post("/petition", (req, res) => {
    db.insertSigner(req.session.user.id, req.body.signature)
        .then(() => {
            res.redirect("/thanks");
        })
        .catch(falseErr => {
            res.render("petition", {
                falseFlag: true,
                falseErr: falseErr
            });
        });
});

app.post("/profile", (req, res) => {
    db.insertProfile(
        req.session.user.id,
        req.body.age,
        capitalize(req.body.city),
        req.body.homepage
    )
        .then(() => {
            res.redirect("/petition");
        })
        .catch(err => {
            res.render("home", {
                errFlag: true,
                err: err
            });
        });
});

app.post("/profile/edit", (req, res) => {
    function editProfile() {
        db.updateUser(
            req.session.user.id,
            req.body.firstname,
            req.body.lastname,
            req.body.email
        ).then(() => {
            db.upsertProfile(
                req.session.user.id,
                req.body.age,
                capitalize(req.body.city),
                req.body.homepage
            )
                .then(() => {
                    if (req.body.password !== "") {
                        bc.hashPassword(req.body.password).then(
                            hashedPassword => {
                                db.changePassword(
                                    req.session.user.id,
                                    hashedPassword
                                ).then(() => {
                                    res.render("home", {
                                        petitionFlag: false,
                                        updated: true
                                    });
                                });
                            }
                        );
                    } else {
                        res.render("home", {
                            petitionFlag: false,
                            updated: true
                        });
                    }
                })
                .catch(err => {
                    console.log(err);
                    res.render("edit", {
                        errFlag: true,
                        err: "Something went wrong :("
                    });
                });
        });
    }
    editProfile();
});

app.post("/thanks", (req, res) => {
    db.deleteSignature(req.session.user.id)
        .then(() => {
            res.redirect("/petition");
        })
        .catch(err => {
            console.log(err);
            res.render("thanks", {
                errFlag: true,
                err: "Something went wrong :("
            });
        });
});

// *****************************************************************************
// listening
// *****************************************************************************

const port = process.env.PORT || 8080;
app.listen(port, () =>
    console.log("...listening... j'ellena-petition", port)
);
