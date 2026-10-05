require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/userModels");
const Laundry = require("../models/laundryModels");
const Service = require("../models/serviceModels");
const TimeSlot = require("../models/timeSlotModels");

async function seedIndoreLaundry() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB successfully.");

    // 1. Create or update Admin User for Indore Laundry
    const adminEmail = "admin.indore@laundryflow.in";
    const adminPhone = "9876501234";
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Indore@1234", salt);
      adminUser = await User.create({
        name: "Indore Laundry Admin",
        email: adminEmail,
        phone: adminPhone,
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        isActive: true,
      });
      console.log("Created admin user for Indore Laundry:", adminUser._id);
    } else {
      adminUser.isVerified = true;
      adminUser.isActive = true;
      adminUser.phone = adminPhone;
      await adminUser.save();
      console.log("Updated existing admin user for Indore Laundry:", adminUser._id);
    }

    // 2. Create or update Indore Laundry store
    const laundryData = {
      name: "Indore Laundry",
      description: "Indore's premier express laundry & dry cleaning service. Sanitized washing, wrinkle-free steam pressing, and organic eco-friendly dry cleaning with 24-hour turnaround.",
      phone: adminPhone,
      email: adminEmail,
      address: "Plot 42, Vijay Nagar Main Road, Near Scheme 54, Indore, Madhya Pradesh",
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452010",
      location: {
        type: "Point",
        coordinates: [75.8937, 22.7533], // Vijay Nagar, Indore
      },
      owner: adminUser._id,
      serviceRadius: 20,
      maxServiceDistanceKm: 20,
      status: "active",
      isActive: true,
      defaultTurnaroundHours: 24,
      openTime: "08:00",
      closeTime: "21:00",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      logo: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&auto=format&fit=crop&q=80",
      commissionPercent: 10,
      distancePricing: [
        { minDistanceKm: 0, maxDistanceKm: 3, deliveryFee: 0 },
        { minDistanceKm: 3.01, maxDistanceKm: 7, deliveryFee: 25 },
        { minDistanceKm: 7.01, maxDistanceKm: 14, deliveryFee: 40 },
        { minDistanceKm: 14.01, maxDistanceKm: 20, deliveryFee: 60 },
      ],
    };

    let laundry = await Laundry.findOne({ name: "Indore Laundry" });
    if (!laundry) {
      laundry = await Laundry.create(laundryData);
      console.log("Created Indore Laundry store:", laundry._id);
    } else {
      Object.assign(laundry, laundryData);
      await laundry.save();
      console.log("Updated Indore Laundry store:", laundry._id);
    }

    // Associate admin user with laundry
    adminUser.laundryId = laundry._id;
    await adminUser.save();

    // 3. Configure Services for Indore Laundry
    const dryCleaningItems = [
      { name: "Shirt", clothingType: "Shirt", price: 80, isActive: true, estimatedHours: 48 },
      { name: "T-Shirt", clothingType: "T-Shirt", price: 70, isActive: true, estimatedHours: 48 },
      { name: "Trouser", clothingType: "Trouser", price: 100, isActive: true, estimatedHours: 48 },
      { name: "Jeans", clothingType: "Jeans", price: 110, isActive: true, estimatedHours: 48 },
      { name: "Suit (2-Piece)", clothingType: "Suit", price: 280, isActive: true, estimatedHours: 48 },
      { name: "Blazer", clothingType: "Blazer", price: 180, isActive: true, estimatedHours: 48 },
      { name: "Coat", clothingType: "Coat", price: 220, isActive: true, estimatedHours: 48 },
      { name: "Jacket", clothingType: "Jacket", price: 200, isActive: true, estimatedHours: 48 },
      { name: "Dress / Gown", clothingType: "Dress", price: 190, isActive: true, estimatedHours: 48 },
      { name: "Saree (Silk / Designer)", clothingType: "Saree", price: 180, isActive: true, estimatedHours: 48 },
      { name: "Kurta / Pyjama", clothingType: "Kurta", price: 120, isActive: true, estimatedHours: 48 },
      { name: "Sherwani", clothingType: "Sherwani", price: 350, isActive: true, estimatedHours: 48 },
      { name: "Bedsheet", clothingType: "Bedsheet", price: 150, isActive: true, estimatedHours: 48 },
      { name: "Blanket / Quilt", clothingType: "Blanket", price: 250, isActive: true, estimatedHours: 48 },
      { name: "Other Delicate Item", clothingType: "Other", price: 120, isActive: true, estimatedHours: 48 },
    ];

    const servicesToCreate = [
      {
        laundryId: laundry._id,
        name: "Standard Wash & Fold",
        description: "Fresh, sanitized laundry washed, tumble dried, and neatly packed.",
        price: 69,
        unit: "per_kg",
        category: "wash",
        estimatedHours: 24,
        isActive: true,
      },
      {
        laundryId: laundry._id,
        name: "Executive Steam Ironing",
        description: "High-pressure crisp steam press for wrinkle-free clothes.",
        price: 20,
        unit: "per_piece",
        category: "iron",
        estimatedHours: 12,
        isActive: true,
      },
      {
        laundryId: laundry._id,
        name: "Gentle Dry Cleaning",
        description: "Eco-friendly solvent dry cleaning for delicate fabrics, suits, sarees, and winter wear.",
        price: 80,
        unit: "per_piece",
        category: "dry_clean",
        estimatedHours: 48,
        isActive: true,
        items: dryCleaningItems,
      },
      {
        laundryId: laundry._id,
        name: "Wash & Steam Iron Combo",
        description: "Complete laundering and steam pressing service.",
        price: 89,
        unit: "per_kg",
        category: "wash_iron",
        estimatedHours: 24,
        isActive: true,
      },
      {
        laundryId: laundry._id,
        name: "Premium Linen & Comforter Care",
        description: "Specialized deep wash and sanitization for heavy blankets, duvets, and curtains.",
        price: 299,
        unit: "per_piece",
        category: "premium",
        estimatedHours: 48,
        isActive: true,
      },
    ];

    // Remove old services for this laundry and recreate fresh
    await Service.deleteMany({ laundryId: laundry._id });
    const createdServices = await Service.insertMany(servicesToCreate);
    console.log(`Created ${createdServices.length} services for Indore Laundry.`);

    // 4. Configure TimeSlots for all 7 days of the week
    await TimeSlot.deleteMany({ laundryId: laundry._id });
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const standardSlots = [
      { startTime: "09:00", endTime: "12:00", maxOrders: 10, isActive: true, label: "Morning (09:00 AM - 12:00 PM)" },
      { startTime: "13:00", endTime: "16:00", maxOrders: 10, isActive: true, label: "Afternoon (01:00 PM - 04:00 PM)" },
      { startTime: "17:00", endTime: "20:00", maxOrders: 10, isActive: true, label: "Evening (05:00 PM - 08:00 PM)" },
    ];

    const timeSlotDocs = daysOfWeek.map((day) => ({
      laundryId: laundry._id,
      day,
      slots: standardSlots,
      isActive: true,
    }));

    await TimeSlot.insertMany(timeSlotDocs);
    console.log("Configured time slots for all 7 days of the week for Indore Laundry.");

    console.log("\n==================================================");
    console.log("SUCCESS: Indore Laundry is fully configured in MongoDB!");
    console.log(`Laundry ID: ${laundry._id}`);
    console.log(`City: ${laundry.city}, Max Service Distance: ${laundry.maxServiceDistanceKm} KM`);
    console.log(`Services: ${createdServices.map((s) => s.name).join(", ")}`);
    console.log("==================================================");

    process.exit(0);
  } catch (err) {
    console.error("Error seeding Indore Laundry:", err);
    process.exit(1);
  }
}

seedIndoreLaundry();
