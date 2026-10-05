const mongoose = require("mongoose");

/**
 * PlatformSettings Model
 * Stores platform-wide configuration for the LaundryFlow Super Admin.
 * Singleton pattern — only one document should exist.
 */
const platformSettingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: "LaundryFlow",
      trim: true,
    },
    defaultCommissionPercent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR"],
    },
    supportEmail: {
      type: String,
      default: "",
      trim: true,
    },
    supportPhone: {
      type: String,
      default: "",
      trim: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    autoApproveLaundries: {
      type: Boolean,
      default: false,
    },
    minOrderAmount: {
      type: Number,
      default: 50,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
