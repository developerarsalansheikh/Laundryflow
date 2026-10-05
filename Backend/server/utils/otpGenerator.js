const crypto = require("crypto");

// 6 digit numeric OTP
const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// Cryptographically secure OTP (optional — zyada secure)
const generateSecureOTP = () => {
  return String(parseInt(crypto.randomBytes(3).toString("hex"), 16))
    .slice(0, 6)
    .padStart(6, "0");
};

module.exports = { generateOTP, generateSecureOTP };
