const express = require("express");
const router = express.Router();
const barnchController = require("../../controllers/branch/branch.controller.js");
const { authenticate } = require("../../middlewares/auth.middleware.js");

router.get("/", barnchController.getAllBranches);
router.get("/all", barnchController.getAllBranch);
router.get(
  "/getAllBranchesWithManagers", authenticate,
  barnchController.getAllBranchesWithManagers
);
router.get(
  "/getBranchAndManagerByUserId/:userId", authenticate,
  barnchController.getBranchAndManagerByUserId
);
router.get("/user/:userId",authenticate, barnchController.getBranchByUserId);
router.post("/", authenticate, barnchController.createBranch);
router.post("/update/:id", authenticate, barnchController.updateBranch);
router.get("/delete/:id", barnchController.deleteBranch);

module.exports = router;
