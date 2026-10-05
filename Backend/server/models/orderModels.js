const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // ── Users ────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── Laundry Reference (Multi-Tenant) ─────────
    laundryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laundry",
      required: [true, "Please select a laundry store"],
    },

    // ── Services ─────────────────────────────────
    services: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        itemName: {
          type: String,
          default: "",
        },
        clothingType: {
          type: String,
          default: "",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        lineTotal: {
          type: Number,
          required: true,
        },
        estimatedHours: {
          type: Number,
          default: 24,
        },
      },
    ],

    // ── Address ──────────────────────────────────
    // FIX 1: Address Reference (ObjectId → Address model)
    pickupAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },
    // Feature Phase A: Address Snapshots for historical integrity
    pickupAddressSnapshot: {
      fullAddress: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      landmark: { type: String, default: "" },
      label: { type: String, default: "home" },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    deliveryAddressSnapshot: {
      fullAddress: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      landmark: { type: String, default: "" },
      label: { type: String, default: "home" },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    // Backward-compat: kept for old data, deprecated for new orders
    address: {
      type: String,
      default: "",
    },

    // ── Status ───────────────────────────────────
    status: {
      type: String,
      enum: [
        "pending",
        "pending_pickup",
        "placed",
        "picked_up",
        "at_laundry_pending_confirmation",
        "received_at_laundry",
        "in_progress",
        "processing",
        "ready",
        "ready_for_delivery",
        "ready_for_redelivery",
        "out_for_delivery",
        "delivery_pending_customer_confirmation",
        "customer_unavailable",
        "delivery_failed",
        "returned_to_laundry",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    // ── Payment ──────────────────────────────────
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    gst: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    minimumOrderCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    pickupDistanceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryDistanceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    laundryEarning: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    // FIX 5: COD support — enum updated: "cash" → "cod"
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod", "upi"],
      default: "razorpay",
    },

    // ── Refund Fields ────────────────────────────
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundStatus: {
      type: String,
      enum: ["none", "initiated", "processed", "failed"],
      default: "none",
    },
    refundedAt: {
      type: Date,
    },

    // ── Schedule ─────────────────────────────────
    // FIX 4: scheduledPickup is now an object with time slot
    scheduledPickup: {
      date: { type: Date },
      timeSlot: {
        startTime: { type: String },
        endTime: { type: String },
        label: { type: String },
      },
    },
    // FIX 2 / Feature C: Authoritative estimated delivery/completion date snapshot
    estimatedDelivery: {
      type: Date,
    },
    estimatedCompletionAt: {
      type: Date,
    },
    scheduledDelivery: {
      type: Date,
    },
    // Feature B: Immutable delivery distance snapshot
    deliveryDistanceKm: {
      type: Number,
      default: 0,
    },

    // ── Extra Info ───────────────────────────────
    specialInstructions: {
      type: String,
      default: "",
    },
    cancelReason: {
      type: String,
      default: "",
    },

    // ── Tracking ─────────────────────────────────
    trackingUpdates: [
      {
        status: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ── Delivery Partner fields ───────────────────
    deliveryOTP: {
      type: String,
      select: false,
    },
    deliveryOTPExpiry: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    // ── Pickup Photo for Driver & Laundry Identification ──
    pickupPhoto: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
      uploadedAt: {
        type: Date,
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // ── Driver Assignment Info (Feature Phase A) ──
    assignmentInfo: {
      mode: {
        type: String,
        enum: ["manual", "automatic"],
        default: "manual",
      },
      status: {
        type: String,
        enum: ["unassigned", "assigned", "failed"],
        default: "unassigned",
      },
      failureReason: {
        type: String,
        default: "",
      },
      assignedAt: {
        type: Date,
      },
      attemptedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes for Frequent Queries (RN-9) ──────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ laundryId: 1, createdAt: -1 });
orderSchema.index({ laundryId: 1, status: 1 });
orderSchema.index({ deliveryPartner: 1, status: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", orderSchema);
