const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["order", "payment", "delivery", "promo", "system"],
      default: "system",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes for Frequent Queries (RN-9) ──────────────────
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
