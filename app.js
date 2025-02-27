const express = require("express");
const exphbs = require("express-handlebars");

require("dotenv").config();
const port = process.env.PORT;
const COOKIE = process.env.PROJECT_DOMAIN;
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const crypto = require("crypto");
const passport = require("passport");
const GithubStrategy = require("passport-github").Strategy;
const { stringify } = require("flatted");
const _ = require("underscore");
const getGitHubData = require("./api");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const hbs = exphbs.create({
  layoutsDir: __dirname + "/views",
});
app.engine("handlebars", hbs.engine);
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

let scopes = ["notifications", "user:email", "read:org", "repo"];
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/login/github/return",
      scope: scopes.join(" "),
    },
    function (token, tokenSecret, profile, cb) {
      return cb(null, { profile: profile, token: token });
    }
  )
);
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());
app.use(
  expressSession({
    secret: crypto.randomBytes(64).toString("hex"),
    resave: true,
    saveUninitialized: true,
  })
);

// Routes
app.get("/", async (req, res) => {
  let data = {
    session: req.cookies[COOKIE] && JSON.parse(req.cookies[COOKIE]),
  };

  if (data.session && data.session.token) {
    let githubData;
    try {
      githubData = await getGitHubData(data.session.token);
    } catch (error) {
      githubData = { error: error };
    }
    _.extend(data, githubData);
  }

  if (data.session) {
    data.session.token = "lalalala";
  }
  data.json = JSON.stringify(data);

  res.render("main", data);
});
app.get("/logoff", function (req, res) {
  res.clearCookie(COOKIE);
  res.redirect("/");
});

app.get("/auth/github", passport.authenticate("github"));

app.get(
  "/login/github/return",
  passport.authenticate("github", {
    successRedirect: "/setcookie",
    failureRedirect: "/",
  })
);

app.get("/setcookie", function (req, res) {
  let data = {
    user: req.session.passport.user.profile._json,
    token: req.session.passport.user.token,
  };
  res.cookie(COOKIE, JSON.stringify(data));
  res.redirect("/");
});

app.listen(3000, () => {
  console.log(`🌏 Server is running at http://localhost:3000`);
});
