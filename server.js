console.log("\x1Bc");

const ca = require("chalk-animation");
const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db/db");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// *****************************************************************************

app.use(bodyParser.urlencoded({ extended: false }));

app.engine("handlebars", hb({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(express.static(__dirname + "/public"));

app.use("/favicon.ico", (req, res) => {
    res.sendStatus(204);
});

// *****************************************************************************

app.use(cookieParser());
app.use((req, res, next) => {
    if (req.cookies.signed && req.url === "/") {
        res.redirect("/thanks");
    } else {
        next();
    }
});

// *****************************************************************************

app.get("/", (req, res) => {
    res.render("home");
});

app.post("/", (req, res) => {
    db.insertSigner(req.body.firstname, req.body.lastname, req.body.signature)
        .then(() => {
            res.cookie("signed", "true");
            res.redirect("/thanks");
        })
        .catch(err => {
            res.render("home", {
                falseFlag: true,
                err: err
            });
        });
});

app.get("/thanks", (req, res) => {
    db.getNumber().then(numSigners => {
        res.render("thanks", {
            numSigners: numSigners
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

app.get("*", (req, res) => {
    res.status(404);
    res.render("fnf");
});

// *****************************************************************************

app.listen(8080, () => ca.rainbow("...listening on 8080"));
