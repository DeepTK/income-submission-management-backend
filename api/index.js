const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
require("dotenv").config();
const http = require("http");
const connectDB = require("../config/db.js");
const cors = require("cors");

const authRoutes = require("../routes/auth/auth.routes.js");
const dashboardRoutes = require("../routes/dashboard/dashboard.routes.js");
const userRoutes = require("../routes/user/user.routes.js");
const branchRoutes = require("../routes/branch/branch.routes.js");
const incomeRoutes = require("../routes/income/income.routes.js");

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const app = express();

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

app.get("/vercel", (req, res) => {
  res.send("Hello, Vercel!");
});

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500).json({ error: res.locals.message });
});

const port = normalizePort(process.env.PORT || "8080");
app.set("port", port);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

server.on("error", onError);
function onError(error) {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
}
