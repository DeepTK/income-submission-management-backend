var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors");

const authRoutes = require("./models/auth/auth.routes.js");
const dashboardRoutes = require("./models/dashboard/dashboard.routes.js");
const userRoutes = require("./models/user/user.routes.js");
const branchRoutes = require("./models/branch/branch.routes.js");
const incomeRoutes = require("./models/income/income.routes.js");

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(cors(corsOptions));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
connectDB();

app.use("/auth", authRoutes);
app.use("/", dashboardRoutes);
app.use("/user", userRoutes);
app.use("/branch", branchRoutes);
app.use("/income", incomeRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
