const { User } = require("../../models/index");
const { generateToken, verifyToken } = require("../../utils/jwt.utils");
const moment = require("moment");
const { verifyPassword, createPassword } = require("../../utils/bcrypt.util");
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const validRoles = ["admin", "user", "superadmin"];

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("branch");
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found" });
    }

    if (!user.isActive) {
      return res
        .status(400)
        .json({ success: false, error: "User deactivated" });
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials" });
    }

    user.lastLogin = moment();
    user.save();

    const token = generateToken(user.id, user.email, user.role, user?.branch?.id || null);

    const data = {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };

    res.status(200).json({
      success: true,
      data: data,
      token,
      msg: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, branch, role = "user", isActive = true } = req.body;

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, error: "User with this email already exists" });
    }

    const hashedPassword = await createPassword(password);

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role,
      branch: branch,
      isActive : isActive,
    });

    await newUser.save();

    res.status(200).json({
      success: true,
      data: newUser,
      msg: "User created",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
