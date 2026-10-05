const mongoose = require("mongoose"); // ✅ correct import

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email address"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Please enter your phone number"],
      unique: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit mobile number"],
    },

    // ── Roles ───────────────────────────────────
    // superadmin → platform owner (tum)
    // admin      → laundry business owner
    // delivery   → delivery partner
    // user       → customer
    role: {
      type: String,
      enum: ["superadmin", "admin", "delivery", "user"],
      default: "user",
    },

    // ── Laundry Reference ────────────────────────
    // admin aur delivery ke liye — kis laundry se belong karta hai
    // superadmin aur user ke liye null rahega
    laundryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laundry",
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    profileImagePublicId: {
      type: String,
      default: null,
    },

    // ── Favorites (Feature A) ────────────────────
    favoriteLaundries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Laundry",
      },
    ],

    // ── OTP fields ──────────────────────────────
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    otpRequestCount: {
      type: Number,
      default: 0,
    },
    otpLastRequestAt: {
      type: Date,
    },

    // ── Token fields ────────────────────────────
    refreshToken: {
      type: String,
      select: false,
    },

    // ── Password reset fields ───────────────────
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpiry: {
      type: Date,
      select: false,
    },

    // ── Delivery Partner specific ─────────────────
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    availabilityStatus: {
      type: String,
      enum: ["offline", "available", "busy"],
      default: "available",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    // FIX 6: Per-order earning history for delivery partner
    earningHistory: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        amount: { type: Number },
        date: { type: Date, default: Date.now },
      },
    ],
    fcmToken: {
      type: String,
      default: null,
    },
    deviceTokens: [
      {
        token: { type: String, required: true },
        platform: { type: String, enum: ["android", "ios", "web"], default: "android" },
        deviceId: { type: String, default: null },
        lastUpdated: { type: Date, default: Date.now },
      },
    ],
    socketId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Normalize phone number before validation/save
userSchema.pre("validate", function () {
  if (this.phone) {
    const { normalizePhone } = require("../utils/phoneNormalizer");
    const normalized = normalizePhone(this.phone);
    if (normalized) {
      this.phone = normalized;
    }
  }
});

// ── Indexes for Frequent Queries (RN-9) ──────────────────
userSchema.index({ role: 1 });
userSchema.index({ role: 1, isAvailable: 1, availabilityStatus: 1 });
userSchema.index({ laundryId: 1 });

module.exports = mongoose.model("User", userSchema);