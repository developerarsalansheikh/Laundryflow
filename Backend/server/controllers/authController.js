const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModels");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { generateOTP } = require("../utils/otpGenerator");
const { sendEmail } = require("../utils/sendEmail");
const { normalizePhone, isValidPhone, buildPhoneQuery } = require("../utils/phoneNormalizer");
const { sendOTPviaSMS } = require("../services/smsService");

const logDevOtp = (phone, otp, type = "Login") => {
  if (process.env.NODE_ENV !== "production") {
    const rawDigits = String(phone).replace(/\D/g, "");
    const last10 = rawDigits.slice(-10);
    const formatted = `+91${last10}`;
    console.log(`[DEV OTP] ${type} OTP for ${formatted}: ${otp}`);
  }
};

// ─────────────────────────────────────────────
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (name, email, phone, password)",
      });
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, buildPhoneQuery(cleanPhone)],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === cleanEmail
            ? "This email is already registered"
            : "This phone number is already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: "user",
      otp,
      otpExpiry,
      isVerified: false,
    });

    logDevOtp(cleanPhone, otp, "Signup");
    await sendOTPviaSMS(cleanPhone, otp);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please enter the verification code sent to your phone",
      data: { userId: user._id, phone: user.phone },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Verify OTP after registration
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and verification code are required",
      });
    }

    const cleanPhone = normalizePhone(phone) || String(phone).trim();
    const user = await User.findOne(buildPhoneQuery(cleanPhone)).select("+otp +otpExpiry");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code",
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      otp: undefined,
      otpExpiry: undefined,
      otpRequestCount: 0,
      refreshToken,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Phone verified successfully. Login complete",
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("VerifyOTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying the code",
      error: error.message,
    });
  }
};

const checkInactiveAdminMessage = async (user) => {
  if (user?.role === "admin") {
    try {
      const Laundry = require("../models/laundryModels");
      const laundry = await Laundry.findOne({
        $or: [{ owner: user._id }, { _id: user.laundryId }],
      });
      if (laundry) {
        if (laundry.status === "pending") {
          return "Your Laundry Admin application is still under review.";
        }
        if (laundry.status === "rejected") {
          return laundry.rejectionReason
            ? `Your Laundry Admin application was rejected: ${laundry.rejectionReason}`
            : "Your Laundry Admin application was rejected.";
        }
        if (laundry.status === "suspended") {
          return "Your Laundry store is suspended. Please contact support.";
        }
      }
    } catch {}
  }
  return "Account is deactivated";
};

// ─────────────────────────────────────────────
// @desc    Login (unified: email/phone+pass or phone+OTP)
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password, phone, identifier } = req.body;
    const loginCredential = (identifier || email || (phone && password ? phone : "")).trim();

    // ── Email or Phone + password login (Admin, Staff, or Customer with password) ──
    if (loginCredential && password) {
      const isEmail = loginCredential.includes("@");
      const cleanEmail = loginCredential.toLowerCase();
      const cleanPhone = normalizePhone(loginCredential);

      const user = await User.findOne(
        isEmail ? { email: cleanEmail } : cleanPhone ? buildPhoneQuery(cleanPhone) : { email: cleanEmail }
      ).select("+password");

      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid email/phone or password" });
      }
      if (!user.isVerified) {
        return res.status(403).json({ success: false, message: "Account is not verified" });
      }
      if (!user.isActive) {
        const message = await checkInactiveAdminMessage(user);
        return res.status(403).json({ success: false, message });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid email/phone or password" });
      }

      const accessToken = generateAccessToken(user._id, user.role);
      const refreshTokenVal = generateRefreshToken(user._id);

      await User.findByIdAndUpdate(user._id, { refreshToken: refreshTokenVal });

      res.cookie("refreshToken", refreshTokenVal, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          accessToken,
          refreshToken: refreshTokenVal,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            laundryId: user.laundryId,
          },
        },
      });
    }

    // ── Customer/Delivery: phone → OTP ──
    if (phone) {
      const cleanPhone = normalizePhone(phone);
      if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: "Please enter a valid 10-digit phone number" });
      }

      const user = await User.findOne(buildPhoneQuery(cleanPhone));
      if (!user) {
        return res.status(404).json({ success: false, message: "This phone number is not registered" });
      }
      if (!user.isActive) {
        const message = await checkInactiveAdminMessage(user);
        return res.status(403).json({ success: false, message });
      }

      // If user phone had legacy format, update to clean 10-digit phone
      if (user.phone !== cleanPhone) {
        user.phone = cleanPhone;
        await user.save();
      }

      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await User.findByIdAndUpdate(user._id, { otp, otpExpiry });

      logDevOtp(cleanPhone, otp, "Login");
      await sendOTPviaSMS(cleanPhone, otp);

      return res.status(200).json({
        success: true,
        message: "Verification code sent. Please check your SMS",
        data: { phone: user.phone },
      });
    }

    return res.status(400).json({
      success: false,
      message: "Please provide email/phone and password, or phone for OTP login",
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Login OTP verify (customer/delivery)
// @route   POST /api/auth/login-verify
// @access  Public
// ─────────────────────────────────────────────
const loginVerifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and verification code are required",
      });
    }

    const cleanPhone = normalizePhone(phone) || String(phone).trim();
    const user = await User.findOne(buildPhoneQuery(cleanPhone)).select("+otp +otpExpiry");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      const message = await checkInactiveAdminMessage(user);
      return res.status(403).json({ success: false, message });
    }

    if (user.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code",
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      otp: undefined,
      otpExpiry: undefined,
      otpRequestCount: 0,
      refreshToken,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          laundryId: user.laundryId,
        },
      },
    });
  } catch (error) {
    console.error("LoginVerifyOTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during OTP verification",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Resend OTP (max 3/hour)
// @route   POST /api/auth/resend-otp
// @access  Public
// ─────────────────────────────────────────────
const resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit phone number" });
    }

    const user = await User.findOne(buildPhoneQuery(cleanPhone)).select("+otpRequestCount +otpRequestWindow");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Rate-limit: max 3 OTPs per hour
    const now = new Date();
    const windowReset = new Date(user.otpRequestWindow || 0);
    if (now < windowReset && (user.otpRequestCount || 0) >= 3) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please wait before requesting again",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const newCount = now < windowReset ? (user.otpRequestCount || 0) + 1 : 1;
    const newWindow = now < windowReset ? windowReset : new Date(Date.now() + 60 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      otp,
      otpExpiry,
      otpRequestCount: newCount,
      otpRequestWindow: newWindow,
    });

    logDevOtp(cleanPhone, otp, "Resend");
    await sendOTPviaSMS(cleanPhone, otp);

    return res.status(200).json({
      success: true,
      message: "Verification code sent again",
      data: { phone: user.phone },
    });
  } catch (error) {
    console.error("ResendOTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (refresh token required)
// ─────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Refresh token not provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: "Refresh token is invalid" });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("RefreshToken error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh token",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────
const logoutUser = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (token) {
      // Invalidate stored refresh token
      await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: undefined });
    }

    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Forgot password — send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Always respond with success to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: "If this email is registered, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: resetTokenHash,
      passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail({
      to: cleanEmail,
      subject: "Password Reset — LaundryFlow",
      html: message,
    });

    return res.status(200).json({
      success: true,
      message: "If this email is registered, a reset link has been sent",
    });
  } catch (error) {
    console.error("ForgotPassword error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send reset email",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ─────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }

    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpiry: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or has expired",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshToken = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("ResetPassword error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Change password (logged in)
// @route   PUT /api/auth/change-password
// @access  Private
// ─────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("ChangePassword error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  loginUser,
  loginVerifyOTP,
  resendOTP,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
  logDevOtp,
};
