const mongoose = require("mongoose");

// FIX 4: Pickup time slot model — laundry admin apne per-day slots define karta hai
const timeSlotSchema = new mongoose.Schema(
  {
    // ── Reference ─────────────────────────────────
    laundryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laundry",
      required: [true, "Laundry ID is required"],
    },

    // ── Day of Week ───────────────────────────────
    day: {
      type: String,
      enum: {
        values: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        message: "Please select a valid day.",
      },
      required: [true, "Please select a day."],
    },

    // ── Slots for this day ────────────────────────
    slots: [
      {
        startTime: {
          type: String, // "09:00"
          required: true,
        },
        endTime: {
          type: String, // "12:00"
          required: true,
        },
        label: {
          type: String, // "Morning (9AM - 12PM)"
          default: "",
        },
        maxOrders: {
          type: Number, // max orders allowed in this slot
          default: 10,
          min: 1,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// One record per laundry per day
timeSlotSchema.index({ laundryId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
