const { default: mongoose } = require("mongoose");

const addressSchema = new mongoose.Schema(
     {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: {
      type: String,
      enum: {
        values: ["home", "office", "other"],
        message: "Label must be home, office, or other",
      },
      default: "home",
    },
    fullAddress: {
      type: String,
      required: [true, "Please enter the full address."],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "Please enter a city."],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "Please enter a state."],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Please enter a pincode."],
      match: [/^\d{6}$/, "Please enter a valid 6-digit pincode."],
    },
    landmark: {
      type: String,
      default: "",
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  {
    timestamps: true,
  }
)



module.exports = mongoose.model("Address", addressSchema)