const mongoose = require("mongoose");

const laundrySchema = new mongoose.Schema(
  {
    // ── Basic Info ───────────────────────────────
    name: {
      type: String,
      required: [true, "Please enter the laundry name."],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    logoPublicId: {
      type: String,
      default: null,
    },

    // ── Owner (admin user) ───────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Contact Info ─────────────────────────────
    phone: {
      type: String,
      required: [true, "Please enter a phone number."],
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number."],
    },
    email: {
      type: String,
      required: [true, "Please enter an email address."],
      lowercase: true,
      trim: true,
    },

    // ── Location ─────────────────────────────────
    address: {
      type: String,
      required: [true, "Please enter an address."],
    },
    city: {
      type: String,
      required: [true, "Please enter a city."],
    },
    state: {
      type: String,
      required: [true, "Please enter a state."],
    },
    pincode: {
      type: String,
      required: [true, "Please enter a pincode."],
      match: [/^\d{6}$/, "Please enter a valid 6-digit pincode."],
    },
    // FIX 3: Geospatial location [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // [longitude, latitude]
      },
    },
    // FIX 3: Service delivery radius in kilometers
    serviceRadius: {
      type: Number,
      default: 10,
      min: [1, "Minimum radius must be at least 1 km"],
    },

    // ── Status ───────────────────────────────────
    // pending   → superadmin ne abhi approve nahi kiya
    // active    → laundry chal rahi hai
    // suspended → superadmin ne band kar diya
    // rejected  → superadmin ne reject kar diya
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    // ── Commission ───────────────────────────────
    // superadmin ka percentage har order pe
    commissionPercent: {
      type: Number,
      default: 10, // 10% default commission
      min: 0,
      max: 100,
    },

    // ── Subscription ─────────────────────────────
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "expired"],
      default: "trial",
    },
    subscriptionExpiry: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 din trial
    },

    // ── Working Hours ────────────────────────────
    openTime: {
      type: String,
      default: "09:00",
    },
    closeTime: {
      type: String,
      default: "21:00",
    },
    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Stats (updated automatically) ────────────
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    // FIX 6: Per-order earning for delivery partners of this laundry
    deliveryPartnerEarningPerOrder: {
      type: Number,
      default: 50, // Rs. 50 per delivery
      min: [0, "Earnings cannot be less than 0."],
    },

    // ── Driver Assignment Mode (Feature Phase A) ──
    driverAssignmentMode: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual",
    },
    autoAssignRadiusKm: {
      type: Number,
      default: 15,
      min: [1, "Auto-assign radius must be at least 1 km"],
    },

    // ── Distance-Based Ordering & Pricing (Feature B) ──
    maxServiceDistanceKm: {
      type: Number,
      default: 20,
      min: [1, "Service distance must be at least 1 km"],
    },
    distancePricing: [
      {
        minDistanceKm: { type: Number, default: 0, min: 0 },
        maxDistanceKm: { type: Number, required: true, min: 0 },
        deliveryFee: { type: Number, required: true, min: 0 },
      },
    ],

    // ── Turnaround Time (Feature C) ──
    defaultTurnaroundHours: {
      type: Number,
      default: 24,
      min: [1, "Turnaround time must be at least 1 hour"],
    },
  },
  {
    timestamps: true,
  }
);

// FIX 3: 2dsphere index for geospatial queries
laundrySchema.index({ location: "2dsphere" });

// ── Indexes for Frequent Queries (RN-9) ──────────────────
laundrySchema.index({ status: 1, isActive: 1 });
laundrySchema.index({ city: 1, status: 1 });
laundrySchema.index({ owner: 1 });

module.exports = mongoose.model("Laundry", laundrySchema);