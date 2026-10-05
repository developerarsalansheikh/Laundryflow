const mongoose = require("mongoose");
const { SUBSCRIPTION_STATUS } = require("../constants/subscriptionStatus");

/**
 * Subscription Model
 *
 * Represents the active subscription contract between a Laundry and a Plan.
 * Each Laundry should have at most one active/trial subscription at a time.
 * Enforced at the application level; compound index assists with queries.
 *
 * Relationship:
 *   Laundry → Subscription → SubscriptionPlan
 */
const subscriptionSchema = new mongoose.Schema(
  {
    // ── Core References ──────────────────────────
    laundry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laundry",
      required: [true, "Laundry reference zaroori hai"],
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: [true, "Subscription plan zaroori hai"],
    },

    // ── Status ───────────────────────────────────
    status: {
      type: String,
      enum: {
        values: Object.values(SUBSCRIPTION_STATUS),
        message: `Status must be one of: ${Object.values(SUBSCRIPTION_STATUS).join(", ")}`,
      },
      default: SUBSCRIPTION_STATUS.TRIAL,
    },

    // ── Validity Period ──────────────────────────
    startDate: {
      type: Date,
      required: [true, "Subscription start date zaroori hai"],
    },
    endDate: {
      type: Date,
      required: [true, "Subscription end date zaroori hai"],
    },

    // ── Renewal ──────────────────────────────────
    autoRenew: {
      type: Boolean,
      default: false,
    },

    // ── Price Snapshot ───────────────────────────
    // Captured at subscription time — prevents plan price changes
    // from retroactively affecting existing subscriptions.
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be less than 0."],
    },
    currency: {
      type: String,
      default: "INR",
    },

    // ── Trial Period ─────────────────────────────
    trialStartDate: {
      type: Date,
      default: null,
    },
    trialEndDate: {
      type: Date,
      default: null,
    },

    // ── Cancellation ─────────────────────────────
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: "",
      trim: true,
    },

    // ── Payment Reference (optional) ─────────────
    // Links to existing Payment model for subscription invoices.
    // Full recurring billing will be implemented in a later phase.
    paymentReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    // ── Notes ────────────────────────────────────
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────
subscriptionSchema.index({ laundry: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Compound — efficient "find active subscription for laundry" queries
subscriptionSchema.index({ laundry: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
