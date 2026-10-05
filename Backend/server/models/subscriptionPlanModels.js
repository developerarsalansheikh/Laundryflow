const mongoose = require("mongoose");

/**
 * SubscriptionPlan Model
 *
 * Defines the available SaaS plan tiers for the LaundryFlow platform.
 * Only SuperAdmin can create / modify / delete plans.
 */
const subscriptionPlanSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────
    name: {
      type: String,
      required: [true, "Please enter the plan name."],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Please enter the plan slug."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers, and hyphens",
      ],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // ── Pricing ──────────────────────────────────
    price: {
      type: Number,
      required: [true, "Please enter the plan price."],
      min: [0, "Price cannot be less than 0."],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    billingCycle: {
      type: String,
      enum: {
        values: ["monthly", "yearly"],
        message: "Billing cycle must be 'monthly' or 'yearly'",
      },
      required: [true, "Please enter the billing cycle."],
    },

    // ── Features ─────────────────────────────────
    // Human-readable list of what the plan includes
    features: {
      type: [String],
      default: [],
    },

    // ── Limits ───────────────────────────────────
    // -1 = unlimited
    maxOrders: {
      type: Number,
      default: -1, // unlimited
      min: -1,
    },
    maxEmployees: {
      type: Number,
      default: -1, // unlimited
      min: -1,
    },

    // ── Display ──────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────
// slug unique index is declared via `unique: true` on the field itself — no schema.index() needed.
subscriptionPlanSchema.index({ isActive: 1 });
subscriptionPlanSchema.index({ sortOrder: 1 });

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
