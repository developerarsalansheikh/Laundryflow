const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/userModels");
const Laundry = require("../models/laundryModels");

const createDeliveryAgent = async () => {
  try {
    const mongoUri = process.env.MONGO_URL;
    if (!mongoUri) {
      console.error("[ERROR] MONGO_URL not found in environment variables");
      process.exit(1);
    }

    console.log("[DB] Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log(`[DB] Connected to database: ${mongoose.connection.name}`);

    // Find active laundry (prefer 'Ali Laundry' or first active laundry)
    let laundry = await Laundry.findOne({ name: /ali/i, isActive: true });
    if (!laundry) {
      laundry = await Laundry.findOne({ isActive: true }) || await Laundry.findOne({});
    }

    if (!laundry) {
      console.error("[ERROR] No laundry found in database to assign delivery agent to.");
      process.exit(1);
    }

    console.log(`[LAUNDRY] Assigning to Laundry: "${laundry.name}" (ID: ${laundry._id}, City: ${laundry.city})`);

    // Agent profile details
    const agentData = {
      name: process.env.DELIVERY_NAME || "Ramesh Kumar (Delivery Agent)",
      email: (process.env.DELIVERY_EMAIL || "delivery@laundryflow.com").toLowerCase().trim(),
      phone: (process.env.DELIVERY_PHONE || "9876543219").trim(),
      passwordPlain: process.env.DELIVERY_PASSWORD || "Delivery@123",
      role: "delivery",
      laundryId: laundry._id,
      isVerified: true,
      isActive: true,
      availabilityStatus: "available",
      isAvailable: true,
      currentLocation: {
        lat: laundry.location?.coordinates?.[1] || 22.7196,
        lng: laundry.location?.coordinates?.[0] || 75.8577,
      },
    };

    // Check if user with phone or email already exists
    let existingUser = await User.findOne({
      $or: [{ phone: agentData.phone }, { email: agentData.email }],
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(agentData.passwordPlain, salt);

    let agent;
    if (existingUser) {
      console.log(`[UPDATE] Found existing user (${existingUser._id}, Role: ${existingUser.role}). Updating to active delivery partner...`);
      existingUser.name = agentData.name;
      existingUser.email = agentData.email;
      existingUser.phone = agentData.phone;
      existingUser.password = hashedPassword;
      existingUser.role = "delivery";
      existingUser.laundryId = laundry._id;
      existingUser.isVerified = true;
      existingUser.isActive = true;
      existingUser.availabilityStatus = "available";
      existingUser.isAvailable = true;
      existingUser.currentLocation = agentData.currentLocation;
      agent = await existingUser.save();
    } else {
      console.log("[CREATE] Creating brand new delivery partner in MongoDB...");
      agent = await User.create({
        name: agentData.name,
        email: agentData.email,
        phone: agentData.phone,
        password: hashedPassword,
        role: "delivery",
        laundryId: laundry._id,
        isVerified: true,
        isActive: true,
        availabilityStatus: "available",
        isAvailable: true,
        currentLocation: agentData.currentLocation,
      });
    }

    console.log("\n=======================================================");
    console.log("   DELIVERY AGENT CREATED / UPDATED SUCCESSFULLY!      ");
    console.log("=======================================================");
    console.log(`ID:           ${agent._id}`);
    console.log(`Name:         ${agent.name}`);
    console.log(`Email:        ${agent.email}`);
    console.log(`Phone:        ${agent.phone}`);
    console.log(`Password:     ${agentData.passwordPlain}`);
    console.log(`Role:         ${agent.role}`);
    console.log(`Laundry:      ${laundry.name} (${laundry._id})`);
    console.log(`Active:       ${agent.isActive}`);
    console.log(`Status:       ${agent.availabilityStatus}`);
    console.log(`Verified:     ${agent.isVerified}`);
    console.log("=======================================================\n");

    await mongoose.disconnect();
    console.log("[DB] Disconnected cleanly.");
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Failed to create delivery agent:", error);
    process.exit(1);
  }
};

createDeliveryAgent();
