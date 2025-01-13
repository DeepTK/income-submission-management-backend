const bcrypt = require("bcryptjs");

const verifyPassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (isMatch) return true;
    else false;
  } catch (error) {
    return false;
  }
};

const createPassword = (password) => {
  try {
    return bcrypt.hash(password, 10);
  } catch (error) {
    throw new Error("Something went wrong");
  }
};

module.exports = {
  verifyPassword,
  createPassword,
};
