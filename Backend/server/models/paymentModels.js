const mongoose = require("mongoose"); // ✅ correct import

const paymentSchema = new mongoose.Schema(
  {
    // ── References ───────────────────────────────
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    laundryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laundry",
      required: true,
    },

    // ── Amount ───────────────────────────────────
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },

    // ── Commission Split ─────────────────────────
    commissionPercent: {
      type: Number,
      default: 10,
    },
    commissionAmount: {
      type: Number,
      default: 0, // superadmin ko milega
    },
    laundryEarning: {
      type: Number,
      default: 0, // laundry owner ko milega
    },

    // ── Status ───────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    // FIX 5: COD support
    method: {
      type: String,
      enum: ["razorpay", "cod", "upi"],
      default: "razorpay",
    },

    // ── Razorpay fields ──────────────────────────
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },

    // ── Refund fields ────────────────────────────
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
    },
    refundedAt: {
      type: Date,
    },
    // FIX 7: Refund status tracking
    refundStatus: {
      type: String,
      enum: ["none", "initiated", "processed", "failed"],
      default: "none",
    },

    // ── Webhook Idempotency ───────────────────────
    webhookEvents: [
      {
        eventId: { type: String },
        eventType: { type: String },
        processedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ── Indexes for Frequent Queries (RN-9) ──────────────────
paymentSchema.index({ order: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ laundryId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);