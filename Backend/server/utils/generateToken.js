const jwt = require("jsonwebtoken");

// Access token — short lived (1 day)
const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Refresh token — long lived (7 days)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = { generateAccessToken, generateRefreshToken };