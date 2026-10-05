const mongoose = require("mongoose");
const Laundry = require("../models/laundryModels");
const cloudinary = require("../config/cloudinary");
const User = require("../models/userModels");
const Order = require("../models/orderModels");
const Service = require("../models/serviceModels");
const TimeSlot = require("../models/timeSlotModels");
const Address = require("../models/addressModels");

// ─────────────────────────────────────────────
// @desc    Nai laundry register karo
// @route   POST /api/laundry/register
// @access  Public (koi bhi laundry register kar sakta hai)
// ─────────────────────────────────────────────
const registerLaundry = async (req, res) => {
  try {
    const {
      name, description, phone, email,
      address, city, state, pincode,
      openTime, closeTime, workingDays,
      // Owner info (new admin account)
      ownerName, ownerPassword,
      lat, lng
    } = req.body;

    const cleanEmail = String(email || "").toLowerCase().trim();
    const { normalizePhone, buildPhoneQuery } = require("../utils/phoneNormalizer");
    const cleanPhone = normalizePhone(phone);

    // Required fields check
    if (!name || !phone || !email || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields: store name, phone, email, address, city, state, and pincode.",
      });
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    if (!ownerName || !ownerPassword) {
      return res.status(400).json({
        success: false,
        message: "Owner name and password are required.",
      });
    }

    // Email already registered check
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    // Phone check
    const phoneExists = await User.findOne(buildPhoneQuery(cleanPhone));
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "This phone number is already registered.",
      });
    }

    // Laundry name already exists check
    const laundryExists = await Laundry.findOne({ name: name.trim() });
    if (laundryExists) {
      return res.status(400).json({
        success: false,
        message: "A laundry store with this name is already registered.",
      });
    }

    // Admin user banao
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);

    const owner = await User.create({
      name: ownerName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: "admin",
      isVerified: true, // superadmin approve karega
      isActive: false,  // superadmin approve hone ke baad active hoga
    });

    const location = {
      type: "Point",
      coordinates: [Number(lng || 0), Number(lat || 0)],
    };

    // Laundry banao
    const laundry = await Laundry.create({
      name: name.trim(),
      description: description || "",
      phone: cleanPhone,
      email: cleanEmail,
      address,
      city,
      state,
      pincode,
      owner: owner._id,
      location,
      openTime: openTime || "09:00",
      closeTime: closeTime || "21:00",
      workingDays: workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      status: "pending", // superadmin approve karega
      rejectionReason: "",
    });

    // Owner ka laundryId update karo
    await User.findByIdAndUpdate(owner._id, { laundryId: laundry._id });

    return res.status(201).json({
      success: true,
      message: "Laundry application submitted successfully. Super Admin will review your application.",
      data: {
        laundryId: laundry._id,
        name: laundry.name,
        status: laundry.status,
        owner: {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
        },
      },
    });
  } catch (error) {
    console.error("RegisterLaundry error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to register laundry",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Apni laundry ki details dekho
// @route   GET /api/laundry/my-laundry
// @access  Private/Admin
// ─────────────────────────────────────────────
const getMyLaundry = async (req, res) => {
  try {
    const laundry = await Laundry.findById(req.user.laundryId).populate(
      "owner",
      "name email phone"
    );

    if (!laundry) {
      return res.status(404).json({
        success: false,
        message: "Laundry not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: laundry,
    });
  } catch (error) {
    console.error("GetMyLaundry error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve laundry details",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Apni laundry update karo
// @route   PUT /api/laundry/my-laundry
// @access  Private/Admin
// ─────────────────────────────────────────────
const updateMyLaundry = async (req, res) => {
  try {
    const {
      name, description, phone,
      address, city, state, pincode,
      openTime, closeTime, workingDays,
      serviceRadius, deliveryPartnerEarningPerOrder,
      lat, lng
    } = req.body;

    const laundry = await Laundry.findById(req.user.laundryId);
    if (!laundry) {
      return res.status(404).json({
        success: false,
        message: "Laundry not found",
      });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (pincode) updateFields.pincode = pincode;
    if (openTime) updateFields.openTime = openTime;
    if (closeTime) updateFields.closeTime = closeTime;
    if (workingDays) updateFields.workingDays = workingDays;
    
    if (serviceRadius !== undefined) updateFields.serviceRadius = Number(serviceRadius);
    if (deliveryPartnerEarningPerOrder !== undefined) {
      updateFields.deliveryPartnerEarningPerOrder = Number(deliveryPartnerEarningPerOrder);
    }
    if (req.body.driverAssignmentMode !== undefined && ["manual", "automatic"].includes(req.body.driverAssignmentMode)) {
      updateFields.driverAssignmentMode = req.body.driverAssignmentMode;
    }
    if (req.body.autoAssignRadiusKm !== undefined) {
      updateFields.autoAssignRadiusKm = Number(req.body.autoAssignRadiusKm);
    }
    if (req.body.maxServiceDistanceKm !== undefined) {
      const maxDist = Number(req.body.maxServiceDistanceKm);
      if (maxDist < 1) {
        return res.status(400).json({ success: false, message: "Maximum service distance must be at least 1 km" });
      }
      updateFields.maxServiceDistanceKm = maxDist;
    }
    if (req.body.defaultTurnaroundHours !== undefined) {
      const hours = Number(req.body.defaultTurnaroundHours);
      if (hours < 1) {
        return res.status(400).json({ success: false, message: "Turnaround time must be at least 1 hour" });
      }
      updateFields.defaultTurnaroundHours = hours;
    }
    if (req.body.distancePricing !== undefined) {
      let tiers = req.body.distancePricing;
      if (typeof tiers === "string") {
        try { tiers = JSON.parse(tiers); } catch (e) {}
      }
      if (Array.isArray(tiers)) {
        updateFields.distancePricing = tiers.map((t) => ({
          minDistanceKm: Number(t.minDistanceKm) || 0,
          maxDistanceKm: Number(t.maxDistanceKm),
          deliveryFee: Number(t.deliveryFee),
        }));
      }
    }
    if (req.body.isActive !== undefined) {
      updateFields.isActive = Boolean(req.body.isActive);
    }
    if (lat !== undefined && lng !== undefined) {
      updateFields.location = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)]
      };
    }

    if (req.file) {
      if (laundry.logoPublicId) {
        try {
          await cloudinary.uploader.destroy(laundry.logoPublicId);
        } catch (err) {
          console.error("Old laundry logo delete failed:", err.message);
        }
      }
      updateFields.logo = req.file.path;
      updateFields.logoPublicId = req.file.filename;
    } else if (req.body.logo !== undefined) {
      updateFields.logo = String(req.body.logo).trim();
    }

    const updated = await Laundry.findByIdAndUpdate(
      req.user.laundryId,
      updateFields,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Laundry details updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("UpdateMyLaundry error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update laundry details",
      error: error.message,
    });
  }
};

const getLaundryDashboard = async (req, res) => {
  try {
    const laundryId = req.user.laundryId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      inProgressOrders,
      readyOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      todayTotalOrders,
      todayPendingOrders,
      todayInProgressOrders,
      todayReadyOrders,
      todayOutForDeliveryOrders,
      todayDeliveredOrders,
      todayCancelledOrders,
      totalServices,
      revenueData,
      todayRevenueData,
    ] = await Promise.all([
      Order.countDocuments({ laundryId }),
      Order.countDocuments({ laundryId, status: { $in: ["pending", "at_laundry_pending_confirmation", "received_at_laundry"] } }),
      Order.countDocuments({ laundryId, status: "in_progress" }),
      Order.countDocuments({ laundryId, status: { $in: ["ready", "ready_for_redelivery"] } }),
      Order.countDocuments({ laundryId, status: { $in: ["out_for_delivery", "delivery_pending_customer_confirmation"] } }),
      Order.countDocuments({ laundryId, status: "delivered" }),
      Order.countDocuments({ laundryId, status: "cancelled" }),
      Order.countDocuments({ laundryId, createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ laundryId, status: { $in: ["pending", "at_laundry_pending_confirmation", "received_at_laundry"] }, createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ laundryId, status: "in_progress", createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ laundryId, status: { $in: ["ready", "ready_for_redelivery"] }, createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ laundryId, status: { $in: ["out_for_delivery", "delivery_pending_customer_confirmation"] }, createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ laundryId, status: "delivered", createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ laundryId, status: "cancelled", createdAt: { $gte: startOfToday } }),
      Service.countDocuments({ laundryId, isActive: true }),
      Order.aggregate([
        {
          $match: {
            laundryId: laundryId,
            isPaid: true,
            status: { $ne: "cancelled" },
          },
        },
        {
          $lookup: {
            from: "payments",
            localField: "_id",
            foreignField: "order",
            as: "paymentDocs",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $max: [
                  0,
                  {
                    $subtract: [
                      "$laundryEarning",
                      {
                        $ifNull: [
                          "$refundAmount",
                          { $ifNull: [{ $arrayElemAt: ["$paymentDocs.refundAmount", 0] }, 0] },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            laundryId: laundryId,
            isPaid: true,
            status: { $ne: "cancelled" },
            $or: [
              { paidAt: { $gte: startOfToday } },
              { paidAt: null, createdAt: { $gte: startOfToday } },
            ],
          },
        },
        {
          $lookup: {
            from: "payments",
            localField: "_id",
            foreignField: "order",
            as: "paymentDocs",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $max: [
                  0,
                  {
                    $subtract: [
                      "$laundryEarning",
                      {
                        $ifNull: [
                          "$refundAmount",
                          { $ifNull: [{ $arrayElemAt: ["$paymentDocs.refundAmount", 0] }, 0] },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]),
    ]);

    // Recent 5 orders
    const recentOrders = await Order.find({ laundryId })
      .populate("user", "name phone")
      .populate("services.service", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // End of today for delivery/pickup scheduling
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Orders to deliver today or overdue from earlier (Dena Hai)
    const todayDeliveries = await Order.find({
      laundryId,
      status: { $nin: ["delivered", "cancelled"] },
      $or: [
        { status: { $in: ["ready", "ready_for_delivery", "ready_for_redelivery", "out_for_delivery", "delivery_pending_customer_confirmation"] } },
        { scheduledDelivery: { $lte: endOfToday } },
        { estimatedDelivery: { $lte: endOfToday } },
      ],
    })
      .populate("user", "name phone email")
      .populate("deliveryPartner", "name phone")
      .populate("services.service", "name price category")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .sort({ scheduledDelivery: 1, createdAt: 1 });

    // Orders to collect today or pending collection from earlier (Collect Karna Hai)
    const todayPickups = await Order.find({
      laundryId,
      status: { $in: ["pending", "pending_pickup", "placed", "at_laundry_pending_confirmation"] },
    })
      .populate("user", "name phone email")
      .populate("deliveryPartner", "name phone")
      .populate("services.service", "name price category")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .sort({ "scheduledPickup.date": 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          pendingOrders,
          inProgressOrders,
          readyOrders,
          outForDeliveryOrders,
          deliveredOrders,
          cancelledOrders,
          todayTotalOrders,
          todayPendingOrders,
          todayInProgressOrders,
          todayReadyOrders,
          todayOutForDeliveryOrders,
          todayDeliveredOrders,
          todayCancelledOrders,
          todayDeliveriesCount: todayDeliveries.length,
          todayPickupsCount: todayPickups.length,
          totalServices,
          totalRevenue: revenueData[0]?.total || 0,
          todayRevenue: todayRevenueData[0]?.total || 0,
        },
        todayDeliveries,
        todayPickups,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("GetLaundryDashboard error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard data. Please try again.",
      error: error.message,
    });
  }
};
// ─────────────────────────────────────────────
// @desc    Delivery partner add karo
// @route   POST /api/laundry/delivery-partner
// @access  Private/Admin
// ─────────────────────────────────────────────
const addDeliveryPartner = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required",
      });
    }

    // Duplicate check
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: exists.email === email
          ? "Ye email pehle se registered hai"
          : "Ye phone number pehle se registered hai",
      });
    }

    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const deliveryPartner = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "delivery",
      laundryId: req.user.laundryId, // is laundry se linked
      isVerified: true,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Delivery partner added successfully",
      data: {
        _id: deliveryPartner._id,
        name: deliveryPartner.name,
        email: deliveryPartner.email,
        phone: deliveryPartner.phone,
        role: deliveryPartner.role,
        laundryId: deliveryPartner.laundryId,
      },
    });
  } catch (error) {
    console.error("AddDeliveryPartner error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to add delivery partner. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Apne delivery partners dekho
// @route   GET /api/laundry/delivery-partners
// @access  Private/Admin
// ─────────────────────────────────────────────
const getDeliveryPartners = async (req, res) => {
  try {
    const partners = await User.find({
      role: "delivery",
    }).select("name email phone isActive availabilityStatus isAvailable lastSeen currentLocation createdAt laundryId");

    return res.status(200).json({
      success: true,
      count: partners.length,
      data: partners,
    });
  } catch (error) {
    console.error("GetDeliveryPartners error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch delivery partners. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Delivery partner activate/deactivate
// @route   PUT /api/laundry/delivery-partner/:id/toggle
// @access  Private/Admin
// ─────────────────────────────────────────────
const toggleDeliveryPartner = async (req, res) => {
  try {
    const partner = await User.findOne({
      _id: req.params.id,
      role: "delivery",
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    const updatedPartner = await User.findByIdAndUpdate(
      partner._id,
      { isActive: !partner.isActive },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Delivery partner ${updatedPartner.isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: updatedPartner.isActive, name: updatedPartner.name },
    });
  } catch (error) {
    console.error("ToggleDeliveryPartner error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update status. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Saari laundries dekho (public)
// @route   GET /api/laundry
// @access  Public
/**
 * Haversine formula to compute distance in km between two lat/lng points
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// ─────────────────────────────────────────────
// @desc    Customer Marketplace: Saari laundries dekho (public)
// @route   GET /api/laundry/all
// @access  Public
// ─────────────────────────────────────────────
const getAllLaundries = async (req, res) => {
  try {
    const { city, lat, lng, search, category, sort = "relevance", page = 1, limit = 20 } = req.query;

    const baseFilter = { status: "active", isActive: true };

    // ── RULE 1 & 2: Strict City-Based Visibility ──
    // Only show laundries belonging to customer's selected city.
    // Laundries from another city must NOT appear.
    if (!city || String(city).trim() === "" || String(city).toLowerCase() === "all") {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        pages: 0,
        data: [],
        message: "Please select a location to view verified laundries in your city.",
      });
    }

    baseFilter.city = { $regex: new RegExp(`^${String(city).trim()}$`, "i") };

    // ── RULE 7: Category Filter ──
    // Laundries offering active services in this category
    if (category && category !== "all") {
      const laundriesWithCategory = await Service.find({
        category,
        isActive: true,
      }).distinct("laundryId");

      baseFilter._id = { $in: laundriesWithCategory };
    }

    // ── RULE 6: Customer Search ──
    // Search must match name, description, address, or service offerings
    // Search must NOT bypass city or active status restrictions
    if (search && String(search).trim() !== "") {
      const q = String(search).trim();
      const searchRegex = new RegExp(q, "i");

      // Find services matching search term
      const serviceMatchLaundryIds = await Service.find({
        name: searchRegex,
        isActive: true,
      }).distinct("laundryId");

      const searchConditions = [
        { name: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
      ];

      if (serviceMatchLaundryIds.length > 0) {
        searchConditions.push({ _id: { $in: serviceMatchLaundryIds } });
      }

      if (baseFilter._id && baseFilter._id.$in) {
        // Intersect category laundry IDs with search laundry IDs
        baseFilter.$and = [
          { _id: baseFilter._id },
          { $or: searchConditions },
        ];
        delete baseFilter._id;
      } else {
        baseFilter.$or = searchConditions;
      }
    }

    // Fetch active candidates in this city/filter
    const candidates = await Laundry.find(baseFilter)
      .select("-commissionPercent -subscriptionStatus -subscriptionExpiry")
      .lean();

    const customerLat = lat !== undefined && lat !== null && lat !== "" ? Number(lat) : null;
    const customerLng = lng !== undefined && lng !== null && lng !== "" ? Number(lng) : null;
    const hasCustomerCoords = !isNaN(customerLat) && !isNaN(customerLng) && customerLat !== null && customerLng !== null;

    // Fetch all active services for these candidates in one round-trip to compute price & categories
    const candidateIds = candidates.map((c) => c._id);
    const services = await Service.find({
      laundryId: { $in: candidateIds },
      isActive: true,
    })
      .select("laundryId name category price clothingType items")
      .lean();

    const servicesByLaundry = {};
    for (const s of services) {
      const lid = s.laundryId.toString();
      if (!servicesByLaundry[lid]) servicesByLaundry[lid] = [];
      servicesByLaundry[lid].push(s);
    }

    // ── Process candidate laundries with distance, 20 KM visibility, and pricing ──
    const processed = [];

    for (const laundry of candidates) {
      let laundryLng = null;
      let laundryLat = null;

      if (
        laundry.location &&
        Array.isArray(laundry.location.coordinates) &&
        laundry.location.coordinates.length === 2 &&
        (laundry.location.coordinates[0] !== 0 || laundry.location.coordinates[1] !== 0)
      ) {
        laundryLng = laundry.location.coordinates[0];
        laundryLat = laundry.location.coordinates[1];
      }

      let distanceKm = null;
      if (hasCustomerCoords && typeof laundryLat === "number" && typeof laundryLng === "number") {
        distanceKm = calculateDistanceKm(customerLat, customerLng, laundryLat, laundryLng);
      }

      // ── RULE 7 & 8: Maximum visible distance is 20 KM ──
      // Laundry > 20 KM away -> Do NOT show.
      if (distanceKm !== null && distanceKm > 20) {
        continue;
      }

      const maxServiceDistance = laundry.maxServiceDistanceKm || laundry.serviceRadius || 20;
      const isServiceable = distanceKm === null ? true : distanceKm <= maxServiceDistance;

      // Distance Charges Preview (Requirement 9: Applied to BOTH pickup and delivery legs when > 3 KM)
      let previewDeliveryFee = 0;
      let freeDeliveryThreshold = 100;
      let previewPickupDistanceCharge = 0;
      let previewDeliveryDistanceCharge = 0;

      if (distanceKm !== null) {
        if (distanceKm <= 3.0) {
          previewDeliveryFee = 0; // FREE within 3 KM for orders >= ₹100
        } else {
          let perLeg = null;
          // Check configured distancePricing tiers
          if (Array.isArray(laundry.distancePricing) && laundry.distancePricing.length > 0) {
            const sortedTiers = [...laundry.distancePricing].sort((a, b) => a.minDistanceKm - b.minDistanceKm);
            for (const tier of sortedTiers) {
              if (distanceKm >= tier.minDistanceKm && distanceKm <= tier.maxDistanceKm) {
                perLeg = tier.deliveryFee;
                break;
              }
            }
            if (perLeg === null && sortedTiers.length > 0) {
              perLeg = sortedTiers[sortedTiers.length - 1]?.deliveryFee;
            }
          }
          if (perLeg === null || perLeg === undefined) {
            // Standard rate: ₹20 base + ₹5 per km beyond 3 km per leg
            perLeg = Math.round(20 + (distanceKm - 3.0) * 5);
          }
          previewPickupDistanceCharge = perLeg;
          previewDeliveryDistanceCharge = perLeg;
          previewDeliveryFee = previewPickupDistanceCharge + previewDeliveryDistanceCharge;
        }
      }

      const laundryServices = servicesByLaundry[laundry._id.toString()] || [];
      const categoriesOffered = Array.from(new Set(laundryServices.map((s) => s.category)));

      // Find lowest service price for price sorting
      let minPrice = 999999;
      for (const s of laundryServices) {
        if (typeof s.price === "number" && s.price < minPrice) {
          minPrice = s.price;
        }
      }
      if (minPrice === 999999) minPrice = 50;

      processed.push({
        ...laundry,
        distanceKm,
        isServiceable,
        maxServiceDistanceKm: maxServiceDistance,
        previewDeliveryFee,
        freeDeliveryEligible: distanceKm !== null && distanceKm <= 3,
        freeDeliveryThreshold,
        categoriesOffered,
        minPrice,
        rating: 4.8, // dynamic rating fallback
      });
    }

    // ── SECTION 8: Sort By Implementation ──
    processed.sort((a, b) => {
      switch (sort) {
        case "distance": {
          const distA = a.distanceKm !== null ? a.distanceKm : 999;
          const distB = b.distanceKm !== null ? b.distanceKm : 999;
          return distA - distB;
        }
        case "rating": {
          return (b.rating || 0) - (a.rating || 0);
        }
        case "price": {
          return (a.minPrice || 0) - (b.minPrice || 0);
        }
        case "turnaround": {
          const tA = a.defaultTurnaroundHours || 24;
          const tB = b.defaultTurnaroundHours || 24;
          return tA - tB;
        }
        case "relevance":
        default: {
          // Relevance: prioritize serviceable first, then highest orders, then distance
          if (a.isServiceable !== b.isServiceable) {
            return a.isServiceable ? -1 : 1;
          }
          if ((b.totalOrders || 0) !== (a.totalOrders || 0)) {
            return (b.totalOrders || 0) - (a.totalOrders || 0);
          }
          const distA = a.distanceKm !== null ? a.distanceKm : 999;
          const distB = b.distanceKm !== null ? b.distanceKm : 999;
          return distA - distB;
        }
      }
    });

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const total = processed.length;
    const paginated = processed.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      success: true,
      count: paginated.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      data: paginated,
    });
  } catch (error) {
    console.error("GetAllLaundries error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching laundries",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Single laundry details + services + serviceability validation
// @route   GET /api/laundry/:id
// @access  Public
// ─────────────────────────────────────────────
const getLaundryById = async (req, res) => {
  try {
    const { city, lat, lng } = req.query;

    const laundry = await Laundry.findOne({
      _id: req.params.id,
      status: "active",
      isActive: true,
    }).select("-commissionPercent -subscriptionStatus -subscriptionExpiry");

    if (!laundry) {
      return res.status(404).json({
        success: false,
        message: "Laundry store not found or currently inactive",
      });
    }

    const services = await Service.find({
      laundryId: req.params.id,
      isActive: true,
    }).sort({ category: 1, price: 1 });

    // Validate serviceability if customer location provided (Rule 6)
    let isServiceable = true;
    let serviceabilityReason = "";
    let distanceKm = null;

    if (city && laundry.city && city.trim().toLowerCase() !== laundry.city.trim().toLowerCase()) {
      isServiceable = false;
      serviceabilityReason = `This store is in ${laundry.city}, but your selected location is ${city}.`;
    }

    const customerLat = lat !== undefined && lat !== null && lat !== "" ? Number(lat) : null;
    const customerLng = lng !== undefined && lng !== null && lng !== "" ? Number(lng) : null;
    if (
      !isNaN(customerLat) &&
      !isNaN(customerLng) &&
      customerLat !== null &&
      customerLng !== null &&
      laundry.location?.coordinates?.length === 2 &&
      (laundry.location.coordinates[0] !== 0 || laundry.location.coordinates[1] !== 0)
    ) {
      distanceKm = calculateDistanceKm(
        customerLat,
        customerLng,
        laundry.location.coordinates[1],
        laundry.location.coordinates[0]
      );

      const maxDistance = laundry.maxServiceDistanceKm || laundry.serviceRadius || 20;
      if (distanceKm > maxDistance) {
        isServiceable = false;
        serviceabilityReason = `This store is ${distanceKm} km away, which exceeds its ${maxDistance} km delivery range.`;
      }
    }

    const laundryObj = laundry.toObject();
    laundryObj.isServiceable = isServiceable;
    laundryObj.serviceabilityReason = serviceabilityReason;
    laundryObj.distanceKm = distanceKm;

    return res.status(200).json({
      success: true,
      data: {
        laundry: laundryObj,
        services,
      },
    });
  } catch (error) {
    console.error("GetLaundryById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching laundry details",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Admin apni laundry ke time slots add kare
// @route   POST /api/laundry/admin/time-slots
// @access  Private/Admin
// ─────────────────────────────────────────────
const addTimeSlot = async (req, res) => {
  try {
    const { day, slots } = req.body;

    if (!day || !slots || !Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        message: "Day and slots array are required",
      });
    }

    const TimeSlot = require("../models/timeSlotModels");

    // Add or update slots for the day
    const timeSlot = await TimeSlot.findOneAndUpdate(
      { laundryId: req.user.laundryId, day },
      { slots },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Time slots saved successfully",
      data: timeSlot,
    });
  } catch (error) {
    console.error("AddTimeSlot error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save time slots. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Public — customer dekhe available slots of a laundry
// @route   GET /api/laundry/:id/time-slots
// @access  Public
// ─────────────────────────────────────────────
const getTimeSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // optional custom date query parameter

    const TimeSlot = require("../models/timeSlotModels");

    const dateObj = date ? new Date(date) : new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[dateObj.getDay()];

    let timeSlotDoc = await TimeSlot.findOne({
      laundryId: id,
      day: currentDay,
    });

    if (!timeSlotDoc || !Array.isArray(timeSlotDoc.slots) || timeSlotDoc.slots.length === 0) {
      const defaultSlots = [
        { startTime: "09:00", endTime: "12:00", label: "Morning (09:00 AM - 12:00 PM)", maxOrders: 10, currentOrders: 0, isActive: true },
        { startTime: "12:00", endTime: "15:00", label: "Afternoon (12:00 PM - 03:00 PM)", maxOrders: 10, currentOrders: 0, isActive: true },
        { startTime: "15:00", endTime: "18:00", label: "Evening (03:00 PM - 06:00 PM)", maxOrders: 10, currentOrders: 0, isActive: true },
        { startTime: "18:00", endTime: "21:00", label: "Night (06:00 PM - 09:00 PM)", maxOrders: 10, currentOrders: 0, isActive: true },
      ];
      timeSlotDoc = await TimeSlot.findOneAndUpdate(
        { laundryId: id, day: currentDay },
        { $setOnInsert: { laundryId: id, day: currentDay, slots: defaultSlots } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const now = new Date();
    const dateStr = date ? String(date).split("T")[0] : null;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isToday = !dateStr || dateStr === todayStr;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const formattedSlots = (timeSlotDoc && Array.isArray(timeSlotDoc.slots) ? timeSlotDoc.slots.filter(s => s.isActive) : []).map(slot => {
      const slotObj = slot.toObject ? slot.toObject() : { ...slot };
      if (isToday && slotObj.startTime) {
        const [startH, startM] = slotObj.startTime.split(":").map(Number);
        const slotStartMinutes = (startH || 0) * 60 + (startM || 0);
        slotObj.isPassed = currentMinutes >= slotStartMinutes;
      } else {
        slotObj.isPassed = false;
      }
      return slotObj;
    });

    return res.status(200).json({
      success: true,
      message: `${currentDay} available pickup slots`,
      data: formattedSlots,
    });
  } catch (error) {
    console.error("GetTimeSlots error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch time slots. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Admin apni laundry ke sabhi time slots dekhe (all days)
// @route   GET /api/laundry/admin/time-slots
// @access  Private/Admin
// ─────────────────────────────────────────────
const getAdminTimeSlots = async (req, res) => {
  try {
    const laundryId = req.user.laundryId;
    if (!laundryId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to any laundry store",
      });
    }

    const timeSlots = await TimeSlot.find({ laundryId });
    return res.status(200).json({
      success: true,
      data: timeSlots,
    });
  } catch (error) {
    console.error("GetAdminTimeSlots error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch time slots. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Admin apni laundry ke customers list dekhe (aggregated from Orders)
// @route   GET /api/laundry/admin/customers
// @access  Private/Admin
// ─────────────────────────────────────────────
const getLaundryCustomers = async (req, res) => {
  try {
    const laundryId = req.user.laundryId;
    if (!laundryId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to any laundry store",
      });
    }

    const { search, page = 1, limit = 20 } = req.query;

    const pipeline = [
      {
        $match: {
          laundryId: new mongoose.Types.ObjectId(laundryId.toString()),
        },
      },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
          totalSpent: { $sum: "$totalAmount" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 1,
          name: "$userDetails.name",
          phone: "$userDetails.phone",
          email: "$userDetails.email",
          orderCount: 1,
          lastOrderDate: 1,
          totalSpent: 1,
        },
      },
    ];

    if (search && search.trim()) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: search.trim(), $options: "i" } },
            { phone: { $regex: search.trim(), $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { lastOrderDate: -1 } });
    pipeline.push({ $skip: (Number(page) - 1) * Number(limit) });
    pipeline.push({ $limit: Number(limit) });

    const customers = await Order.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("GetLaundryCustomers error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers. Please try again.",
      error: error.message,
    });
  }
};
// ─────────────────────────────────────────────
// @desc    Update driver assignment mode (manual / automatic)
// @route   PUT /api/laundry/admin/assignment-mode
// @access  Private/Admin
// ─────────────────────────────────────────────
const updateAssignmentMode = async (req, res) => {
  try {
    const { mode, autoAssignRadiusKm } = req.body;
    if (!["manual", "automatic"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Assignment mode must be either 'manual' or 'automatic'",
      });
    }

    const updates = { driverAssignmentMode: mode };
    if (autoAssignRadiusKm) {
      updates.autoAssignRadiusKm = Number(autoAssignRadiusKm);
    }

    const laundry = await Laundry.findByIdAndUpdate(
      req.user.laundryId,
      updates,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Assignment mode set to ${mode}`,
      data: {
        driverAssignmentMode: laundry.driverAssignmentMode,
        autoAssignRadiusKm: laundry.autoAssignRadiusKm,
      },
    });
  } catch (error) {
    console.error("UpdateAssignmentMode error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update assignment mode. Please try again.",
      error: error.message,
    });
  }
};

module.exports = {
  registerLaundry,
  getMyLaundry,
  updateMyLaundry,
  updateAssignmentMode,
  getLaundryDashboard,
  addDeliveryPartner,
  getDeliveryPartners,
  toggleDeliveryPartner,
  getAllLaundries,
  getLaundryById,
  addTimeSlot,
  getTimeSlots,
  getAdminTimeSlots,
  getLaundryCustomers,
};