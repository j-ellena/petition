console.log("\x1Bc");

const ca = require("chalk-animation");
const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db/db");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

// *****************************************************************************

app.use(bodyParser.urlencoded({ extended: false }));

app.engine("handlebars", hb({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(express.static(__dirname + "/public"));

app.use("/favicon.ico", (req, res) => {
    res.sendStatus(204);
});

// *****************************************************************************

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(csurf());
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// *****************************************************************************

function checkForSig(req, res, next) {
    !req.session.signerId ? res.redirect("/") : next();
}

// *****************************************************************************

app.get("/", (req, res) => {
    req.session.signerId ? res.redirect("/thanks") : res.render("home");
});

app.post("/", (req, res) => {
    db.insertSigner(req.body.firstname, req.body.lastname, req.body.signature)
        .then(newSigner => {
            req.session.signerId = newSigner.id;
            res.redirect("/thanks");
        })
        .catch(falseErr => {
            res.render("home", {
                falseFlag: true,
                falseErr: falseErr
            });
        });
});

app.get("/thanks", checkForSig, (req, res) => {
    db.getSignature(req.session.signerId).then(signature => {
        db.getNumber()
            .then(numSigners => {
                res.render("thanks", {
                    numSigners: numSigners,
                    signature: signature
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

app.get("/list", (req, res) => {
    db.returnSigners().then(listSigners => {
        res.render("list", {
            listSigners: listSigners,
            numSigners: listSigners.length
        });
    });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout");
});

app.get("*", (req, res) => {
    res.status(404);
    res.render("fnf");
});

// *****************************************************************************

app.listen(8080, () => ca.rainbow("...listening on 8080"));
