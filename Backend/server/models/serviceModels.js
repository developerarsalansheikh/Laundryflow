const mongoose = require("mongoose"); // ✅ correct import

const serviceSchema = new mongoose.Schema(
  {
    // ── Laundry Reference (Multi-Tenant) ─────────
    // har service ek specific laundry ki hoti hai
    laundryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laundry",
      required: [true, "Please select a laundry."],
    },

    // ── Basic Info ───────────────────────────────
    name: {
      type: String,
      required: [true, "Please enter the service name."],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Please enter a price."],
      min: [0, "Price cannot be less than 0."],
    },
    unit: {
      type: String,
      enum: {
        values: ["per_piece", "per_kg"],
        message: "Unit must be per_piece or per_kg",
      },
      default: "per_piece",
    },
    category: {
      type: String,
      enum: {
        values: ["wash", "dry_clean", "iron", "wash_iron", "premium"],
        message: "Please select a valid category.",
      },
      required: [true, "Please select a category."],
    },
    image: {
      type: String,
      default: "",
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    // FIX 2: Estimated time to complete this service
    estimatedHours: {
      type: Number,
      required: [true, "Please enter the estimated processing time."],
      min: [1, "Minimum estimated time must be 1 hour"],
      default: 24,
      // e.g. 24 = 1 din, 48 = 2 din
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Configurable Clothing Type (e.g. Shirt, Trouser, Suit, Saree)
    clothingType: {
      type: String,
      default: null,
      trim: true,
    },
    // Configurable sub-items / clothing types with individual pricing
    items: [
      {
        name: { type: String, required: true, trim: true },
        clothingType: { type: String, trim: true },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
        estimatedHours: { type: Number, default: 24 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Service", serviceSchema);