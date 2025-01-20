const { User } = require("../../models/index");
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("branch");
    res
      .status(200)
      .json({ success: true, data: users, msg: "All Users Fetched" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).populate("branch");

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    res.status(200).json({ success: true, data: user, msg: "User Fetched" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserByBranchId = async (req, res) => {
  try {
    const branch = req.params.branchId;
    const user = await User.find({
      branch: branch,
    }).populate('branch');
    res.status(200).json({ success: true, data: user, msg: "User Fetched" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    const _id = req.params.userId;
    const { name, email, password, branch, role } = req.body;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.branch = branch || user.branch;
    user.role = role || user.role;

    if (password) {
      const hashedPassword = await createPassword(password);
      user.password = hashedPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      msg: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const _id = req.params.userId;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      msg: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
