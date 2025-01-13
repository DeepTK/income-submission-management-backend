const express = require("express");
const router = express.Router();
const barnchController = require("./branch.controller");
const { authenticate } = require("../../middlewares/auth.middleware.js");

router.get("/", barnchController.getAllBranches);
router.get("/all", barnchController.getAllBranch);
router.get(
  "/getAllBranchesWithManagers",
  barnchController.getAllBranchesWithManagers
);
router.get(
  "/getBranchAndManagerByUserId/:userId",
  barnchController.getBranchAndManagerByUserId
);
router.get("/user/:userId", barnchController.getBranchByUserId);
router.post("/", authenticate, barnchController.createBranch);
router.post("/update/:id", authenticate, barnchController.updateBranch);
router.get("/delete/:id", barnchController.deleteBranch);

module.exports = router;
