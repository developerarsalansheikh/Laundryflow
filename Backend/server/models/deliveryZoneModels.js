const mongoose = require("mongoose");

const deliveryZoneSchema = new mongoose.Schema(
  {
    laundryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laundry",
      required: [true, "Laundry ID zaroori hai"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Please enter the zone name."],
      trim: true,
    },
    deliveryFee: {
      type: Number,
      required: [true, "Please enter the delivery fee."],
      min: [0, "Delivery fee cannot be less than 0."],
      default: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be less than 0."],
    },
    estimatedDeliveryHours: {
      type: Number,
      default: 24,
      min: [1, "Estimated delivery hours must be at least 1"],
    },
    pincodes: {
      type: [String],
      default: [],
    },
    radiusKm: {
      type: Number,
      default: null, // null = relies purely on pincodes or laundry service radius
      min: [0.1, "Radius cannot be less than 0.1 km."],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

deliveryZoneSchema.index({ laundryId: 1, isActive: 1 });
deliveryZoneSchema.index({ laundryId: 1, pincodes: 1 });

module.exports = mongoose.model("DeliveryZone", deliveryZoneSchema);
