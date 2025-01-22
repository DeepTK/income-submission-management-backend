const { User } = require("../../models/index");
const { generateToken, verifyToken } = require("../../utils/jwt.utils");
const moment = require("moment");
const { verifyPassword, createPassword } = require("../../utils/bcrypt.util");
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const validRoles = ["admin", "user", "superadmin"];

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const user = await User.findOne({ email }).populate("branch");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: "User is deactivated" });
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    user.lastLogin = moment();
    await user.save();

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
      data,
      token,
      msg: "Login successful",
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ success: false, error: "An internal server error occurred" });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, branch, role = "user", isActive = true } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role",
      });
    }

    const hashedPassword = await createPassword(password);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      branch,
      isActive,
    });
    await newUser.save();

    const { password: _, ...userData } = newUser.toObject();

    res.status(201).json({
      success: true,
      data: userData,
      msg: "User created successfully",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      error: "An internal server error occurred",
    });
  }
};
