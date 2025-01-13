const express = require("express");
const router = express.Router();
const incomeController = require("./income.controller.js");
const { authenticate } = require("../../middlewares/auth.middleware.js");

router.post("/", authenticate, incomeController.addIncome);
router.post("/update/:incomeId", authenticate, incomeController.updateIncome);
router.get("/", authenticate, incomeController.getAllIncome);
router.get(
  "/branch/:branchId",
  authenticate,
  incomeController.getIncomeByBranch
);

router.get('/user/:userId', authenticate, incomeController.getIncomeByUser);
router.get('/my', authenticate, incomeController.getMyIncome);
router.get('/delete/:id', authenticate, incomeController.deleteIncome);

module.exports = router;
