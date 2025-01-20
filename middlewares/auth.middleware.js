const { verifyToken } = require("../utils/jwt.utils");

exports.authenticate = (req, res, next) => {

  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Authorization required" });
  }

  try {
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, error: "Invalid or expired token" });
  }
};
