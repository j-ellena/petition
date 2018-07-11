console.log("\x1Bc");

const ca = require("chalk-animation");
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

// *****************************************************************************
// global variables
// *****************************************************************************

//

// *****************************************************************************
// handy functions
// *****************************************************************************

function checkForLog(req, res, next) {
    req.session.user ? next() : res.redirect("/login");
}

function checkForSig(req, res, next) {
    !req.session.user
        ? // unlogged user
        res.redirect("/login")
        : // logged user
        db.getSignature(req.session.user.id).then(result => {
            // signed petiton
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

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// *****************************************************************************
// get routes
// *****************************************************************************

app.get("/", (req, res) => {
    res.render("home", {
        petitionFlag: false,
        loginFlag: false
    });
});

app.get("/register", (req, res) => {
    res.render("register", {
        petitionFlag: false,
        loginFlag: false
    });
});

app.get("/profile", checkForLog, (req, res) => {
    res.render("profile", {
        petitionFlag: false,
        loginFlag: true
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        petitionFlag: false,
        loginFlag: false
    });
});

app.get("/petition", checkForSig, (req, res) => {
    res.render("petition", {
        firstName: req.session.user.first_name,
        lastName: req.session.user.last_name,
        petitionFlag: false,
        loginFlag: true
    });
});

app.get("/thanks", checkForSig, (req, res) => {
    db.getSignature(req.session.user.id).then(result => {
        db.getNumber()
            .then(numSigners => {
                res.render("thanks", {
                    numSigners: numSigners,
                    signature: result.signature,
                    petitionFlag: true,
                    loginFlag: true
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

app.get("/list", checkForSig, (req, res) => {
    db.getNumber().then(numSigners => {
        db.getSigners().then(listSigners => {
            res.render("list", {
                listSigners: listSigners,
                numSigners: numSigners,
                petitionFlag: true,
                loginFlag: true
            });
        });
    });
});

app.get("/list/:city", checkForSig, (req, res) => {
    db.getCity(req.params.city.toLowerCase())
        .then(result => {
            res.render("city", {
                listSigners: result,
                city: capitalize(req.params.city),
                petitionFlag: true,
                loginFlag: true
            });
        })
        .catch(err => {
            res.render("city", {
                errFlag: true,
                err: err
            });
        });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout", {
        loginFlag: false,
        petitionFlag: false
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
    //
    db.getEmail(req.body.email)
        //
        .then(() => {
            //
            bc.hashPassword(req.body.password)
                //
                .then(hashedPassword => {
                    //
                    db.insertUser(
                        req.body.firstname,
                        req.body.lastname,
                        req.body.email,
                        hashedPassword
                    )
                        //
                        .then(registeredUser => {
                            req.session.user = registeredUser;
                            res.redirect("/profile");
                        })
                        //
                        .catch(falseErr => {
                            console.log(falseErr.detail);
                            res.render("register", {
                                falseFlag: true,
                                falseErr: "All fields are required!"
                            });
                        });
                });
        })
        //
        .catch(err => {
            res.render("register", {
                falseFlag: true,
                falseErr: err
            });
        });
});

app.post("/profile", (req, res) => {
    db.insertProfile(
        req.session.user.id,
        req.body.age,
        req.body.city.toLowerCase(),
        req.body.homepage
    )

        .then(newProfile => {
            req.session.profile = newProfile;
            res.redirect("/petition");
        })

        .catch(err => {
            res.render("home", {
                errFlag: true,
                err: err
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

// *****************************************************************************
// *****************************************************************************

app.listen(
    process.env.PORT || 8080,
    () => console.log("...listening... j'ellena-petition"),
    process.env.PORT
);
