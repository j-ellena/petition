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

// let petitionFlag = false;

// *****************************************************************************
// handy functions
// *****************************************************************************

function checkForLog(req, res, next) {
    req.session.user ? next() : res.redirect("/login");
}

function checkForSig(req, res, next) {
    db.getSignature(req.session.user.id).then(result => {
        if (result && req.url == "/petition") {
            res.redirect("/thanks");
        } else {
            next();
        }
    });
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

app.get("/login", (req, res) => {
    res.render("login", {
        petitionFlag: false,
        loginFlag: false
    });
});

app.get("/petition", (checkForLog, checkForSig), (req, res) => {
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
    db.getSigners().then(listSigners => {
        res.render("list", {
            listSigners: listSigners,
            numSigners: listSigners.length,
            petitionFlag: true,
            loginFlag: true
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
                .then(registeredUser => {
                    req.session.user = registeredUser;
                    req.session.loginFlag = true;
                    res.redirect("/petition");
                })
                .catch(falseErr => {
                    res.render("register", {
                        falseFlag: true,
                        falseErr: falseErr
                    });
                });
        });
});

app.post("/login", (req, res) => {
    //
    db.getPassword(req.body.email)
        //
        .then(hashedPassword => {
            //
            bc.checkPassword(req.body.password, hashedPassword)
                //
                .then(checkedPassword => {
                    //
                    if (checkedPassword) {
                        db.getUser(req.body.email)
                            //
                            .then(loggedUser => {
                                req.session.user = loggedUser;
                                req.session.loginFlag = true;
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
    //
    db.insertSigner(req.session.user.id, req.body.signature)
        //
        .then(() => {
            req.session.petitionFlag = true;
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

app.listen(8080, () => ca.rainbow("...listening on 8080"));
