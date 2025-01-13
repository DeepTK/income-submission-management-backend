const express = require("express");
const router = express.Router();
const dashboardController = require("./dashboard.controller.js");
const { authenticate } = require("../../middlewares/auth.middleware.js");

router.post(
  "/getDashboardData",
  authenticate,
  dashboardController.getDashboardData
);
router.post("/missingIncome", authenticate, dashboardController.missingIncome);
router.get("/checkIncome/:userId", authenticate, dashboardController.checkIncome);

module.exports = router;
