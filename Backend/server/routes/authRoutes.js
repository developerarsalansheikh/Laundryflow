const express = require("express")
const { protect } = require("../middleware/authMiddleware");
const { registerUser, verifyOTP, loginUser, loginVerifyOTP, resendOTP, refreshToken, logoutUser, forgotPassword, resetPassword, changePassword } = require("../controllers/authController");


const router = express.Router()

router.post("/register", registerUser);          // Step 1: naam, email, phone, password
router.post("/verify-otp", verifyOTP);           // Step 2: OTP verify → token milega

// ── Login ───────────────────────────────────────
router.post("/login", loginUser);                // Admin: email+pass | Customer: phone → OTP
router.post("/login-verify", loginVerifyOTP);    // Customer: OTP verify → token milega

// ── OTP ─────────────────────────────────────────
router.post("/resend-otp", resendOTP);           // OTP dobara bhejo (max 3/hour)

// ── Token ───────────────────────────────────────
router.post("/refresh-token", refreshToken);     // Naya access token lo
router.post("/logout", logoutUser);              // Logout (cookie clear)

// ── Password ────────────────────────────────────
router.post("/forgot-password", forgotPassword); // Email pe reset link
router.post("/reset-password/:token", resetPassword); // Token se naya password
router.put("/change-password", protect, changePassword); // Login ke baad password change


module.exports = router