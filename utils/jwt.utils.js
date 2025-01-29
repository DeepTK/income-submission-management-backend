const jwt = require("jsonwebtoken");

const generateToken = (_id, email, role, branch) => {
  const payload = { _id, email, role, branch };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "20m" });
  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
