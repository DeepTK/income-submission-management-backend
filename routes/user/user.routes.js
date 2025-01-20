const express = require("express");
const router = express.Router();
const userController = require("../../controllers/user/user.controller.js");
const { authenticate } = require("../../middlewares/auth.middleware.js");

router.get("/", authenticate, userController.getAllUsers);
router.get("/:id", authenticate, userController.getUserById);
router.get("/branch/:branchId", authenticate, userController.getUserByBranchId);
router.post("/update/:userId", authenticate, userController.updateUserById);
router.get("/delete/:userId", authenticate, userController.deleteUserById);

module.exports = router;
