const jwt = require("jsonwebtoken");
const User = require("../models/userModels");

// ─────────────────────────────────────────────
// @desc  Protect routes — JWT verification
// ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in to continue.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "-password -otp -otpExpiry -refreshToken -passwordResetToken -passwordResetExpiry"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid. Please log in again.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Account not verified. Please complete phone verification.",
      });
    }

    const normalizeRole = (role) => {
      if (!role) return "user";
      const r = String(role).toLowerCase().trim();
      if (r === "driver" || r === "delivery_partner" || r === "delivery_agent" || r === "deliverypartner") {
        return "delivery";
      }
      if (r === "laundry_admin" || r === "laundryadmin" || r === "owner") {
        return "admin";
      }
      if (r === "super_admin" || r === "super-admin") {
        return "superadmin";
      }
      if (r === "customer") {
        return "user";
      }
      return r;
    };

    req.user = user;
    if (req.user) {
      req.user.role = normalizeRole(req.user.role);
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid token. Please log in again.",
    });
  }
};

// ─────────────────────────────────────────────
// @desc  Role based access control
// @usage restrictTo("superadmin")
//        restrictTo("admin", "superadmin")
//        restrictTo("delivery")
// ─────────────────────────────────────────────
const restrictTo = (...roles) => {
  const normalizeRole = (role) => {
    if (!role) return "user";
    const r = String(role).toLowerCase().trim();
    if (r === "driver" || r === "delivery_partner" || r === "delivery_agent" || r === "deliverypartner") {
      return "delivery";
    }
    if (r === "laundry_admin" || r === "laundryadmin" || r === "owner") {
      return "admin";
    }
    if (r === "super_admin" || r === "super-admin") {
      return "superadmin";
    }
    if (r === "customer") {
      return "user";
    }
    return r;
  };
  const normalizedAllowed = roles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in to continue.",
      });
    }

    const userRole = normalizeRole(req.user.role);
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${roles.join("/")} accounts can perform this action.`,
      });
    }

    next();
  };
};

// ─────────────────────────────────────────────
// @desc  Laundry access check
//        Admin can only access their own laundry
// ─────────────────────────────────────────────
const checkLaundryAccess = (req, res, next) => {
  // superadmin can access all laundries
  if (req.user.role === "superadmin") return next();

  // admin can only access their own laundry
  if (
    req.user.role === "admin" &&
    req.user.laundryId?.toString() !== req.params.laundryId
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only manage your own laundry store.",
    });
  }

  next();
};

module.exports = { protect, restrictTo, checkLaundryAccess };

