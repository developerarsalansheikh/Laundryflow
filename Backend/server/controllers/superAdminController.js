const mongoose = require("mongoose");
const Laundry = require("../models/laundryModels");
const User = require("../models/userModels");
const Order = require("../models/orderModels");
const Payment = require("../models/paymentModels");

// ─────────────────────────────────────────────
// @desc    Platform dashboard — sab stats
// @route   GET /api/super-admin/dashboard
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const [
      totalLaundries,
      activeLaundries,
      pendingLaundries,
      totalUsers,
      totalOrders,
      revenueData,
      commissionData,
    ] = await Promise.all([
      Laundry.countDocuments(),
      Laundry.countDocuments({ status: "active" }),
      Laundry.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "user" }),
      Order.countDocuments(),
      Order.aggregate([
        {
          $match: {
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
                      "$totalAmount",
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
                $cond: [
                  {
                    $gt: [
                      {
                        $ifNull: [
                          "$refundAmount",
                          { $ifNull: [{ $arrayElemAt: ["$paymentDocs.refundAmount", 0] }, 0] },
                        ],
                      },
                      0,
                    ],
                  },
                  {
                    $round: [
                      {
                        $multiply: [
                          {
                            $max: [
                              0,
                              {
                                $subtract: [
                                  "$totalAmount",
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
                          {
                            $divide: [
                              { $ifNull: ["$commissionAmount", 0] },
                              { $cond: [{ $gt: ["$totalAmount", 0] }, "$totalAmount", 1] },
                            ],
                          },
                        ],
                      },
                      2,
                    ],
                  },
                  "$commissionAmount",
                ],
              },
            },
          },
        },
      ]),
    ]);

    // Recent 5 laundry registrations
    const recentLaundries = await Laundry.find()
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalLaundries,
          activeLaundries,
          pendingLaundries,
          totalUsers,
          totalOrders,
          totalRevenue: revenueData[0]?.total || 0,
          totalCommission: commissionData[0]?.total || 0,
        },
        recentLaundries,
      },
    });
  } catch (error) {
    console.error("GetDashboard error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard data. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Saari laundries dekho
// @route   GET /api/super-admin/laundries
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getAllLaundries = async (req, res) => {
  try {
    const { status, city, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (city) filter.city = { $regex: city, $options: "i" };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { address: searchRegex },
        { phone: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

    const laundries = await Laundry.find(filter)
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Laundry.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: laundries.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: laundries,
    });
  } catch (error) {
    console.error("GetAllLaundries error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch laundries. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Laundry approve karo
// @route   PUT /api/super-admin/laundries/:id/approve
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const approveLaundry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Laundry ID format",
      });
    }

    const laundry = await Laundry.findById(req.params.id);

    if (!laundry) {
      return res.status(404).json({
        success: false,
        message: "Laundry store not found",
      });
    }

    if (laundry.status === "active") {
      return res.status(400).json({
        success: false,
        message: "This laundry store is already active",
      });
    }

    // Laundry active karo using findByIdAndUpdate
    const updatedLaundry = await Laundry.findByIdAndUpdate(
      req.params.id,
      { status: "active", isActive: true, rejectionReason: "" },
      { new: true }
    );

    // Owner account activate karo
    if (updatedLaundry?.owner) {
      await User.findByIdAndUpdate(updatedLaundry.owner, { isActive: true, isVerified: true });
    }

    // Trigger notification asynchronously
    const { notifyLaundryApproved } = require("../services/notificationService");
    notifyLaundryApproved(updatedLaundry, updatedLaundry.owner).catch((err) =>
      console.error("Laundry approved notification failed:", err.message)
    );

    return res.status(200).json({
      success: true,
      message: "Laundry successfully approve ho gayi",
      data: updatedLaundry,
    });
  } catch (error) {
    console.error("ApproveLaundry error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to approve laundry. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Laundry reject karo
// @route   PUT /api/super-admin/laundries/:id/reject
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const rejectLaundry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Laundry ID format",
      });
    }

    const reason = req.body?.reason || "Rejected by superadmin";

    const laundry = await Laundry.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", isActive: false, rejectionReason: reason },
      { new: true }
    );

    if (!laundry) {
      return res.status(404).json({
        success: false,
        message: "Laundry store not found",
      });
    }

    if (laundry.owner) {
      await User.findByIdAndUpdate(laundry.owner, { isActive: false });
    }

    // Trigger notification asynchronously
    const { notifyLaundryRejected } = require("../services/notificationService");
    notifyLaundryRejected(laundry, laundry.owner, reason).catch((err) =>
      console.error("Laundry rejected notification failed:", err.message)
    );

    return res.status(200).json({
      success: true,
      message: "Laundry reject ho gayi",
      data: laundry,
    });
  } catch (error) {
    console.error("RejectLaundry error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to reject laundry. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Laundry suspend karo
// @route   PUT /api/super-admin/laundries/:id/suspend
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const suspendLaundry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Laundry ID format",
      });
    }

    const laundry = await Laundry.findByIdAndUpdate(
      req.params.id,
      { status: "suspended", isActive: false },
      { new: true }
    );

    if (!laundry) {
      return res.status(404).json({
        success: false,
        message: "Laundry store not found",
      });
    }

    // Owner bhi deactivate karo
    await User.findByIdAndUpdate(laundry.owner, { isActive: false });

    return res.status(200).json({
      success: true,
      message: "Laundry suspended successfully",
      data: laundry,
    });
  } catch (error) {
    console.error("SuspendLaundry error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to suspend laundry. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Commission update karo
// @route   PUT /api/super-admin/laundries/:id/commission
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const updateCommission = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Laundry ID format",
      });
    }

    const commissionPercent = req.body?.commissionPercent;

    if (commissionPercent === undefined || commissionPercent < 0 || commissionPercent > 100) {
      return res.status(400).json({
        success: false,
        message: "Commission must be between 0 and 100",
      });
    }

    const laundry = await Laundry.findByIdAndUpdate(
      req.params.id,
      { commissionPercent },
      { new: true }
    );

    if (!laundry) {
      return res.status(404).json({
        success: false,
        message: "Laundry store not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Commission set to ${commissionPercent}%`,
      data: { commissionPercent: laundry.commissionPercent },
    });
  } catch (error) {
    console.error("UpdateCommission error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update commission. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Saare users dekho (SuperAdmin)
// @route   GET /api/super-admin/users
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

    const users = await User.find(filter)
      .select("-password -otp -otpExpiry -refreshToken -passwordResetToken -passwordResetExpiry")
      .populate("laundryId", "name city status")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: users,
    });
  } catch (error) {
    console.error("GetAllUsers error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch users. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Single user details (SuperAdmin)
// @route   GET /api/super-admin/users/:id
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID format",
      });
    }

    const user = await User.findById(id)
      .select("-password -otp -otpExpiry -refreshToken -passwordResetToken -passwordResetExpiry")
      .populate("laundryId", "name city address status")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get basic activity stats
    let stats = null;
    if (user.role === "user") {
      const orderCount = await Order.countDocuments({ user: id });
      stats = { orderCount };
    } else if (user.role === "delivery") {
      const activeDeliveries = await Order.countDocuments({
        deliveryPartner: id,
        status: { $in: ["picked_up", "out_for_delivery"] },
      });
      stats = { activeDeliveries };
    }

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        stats,
      },
    });
  } catch (error) {
    console.error("GetUserById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch user details. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Activate/Deactivate user account (SuperAdmin)
// @route   PUT /api/super-admin/users/:id/toggle-status
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID format",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Modifying SuperAdmin status is not allowed",
      });
    }

    const newActiveState =
      req.body.isActive !== undefined ? Boolean(req.body.isActive) : !user.isActive;

    user.isActive = newActiveState;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("ToggleUserStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update user status. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Saare orders dekho platform-wide (SuperAdmin)
// @route   GET /api/super-admin/orders
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      laundryId,
      paymentStatus,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (laundryId && mongoose.Types.ObjectId.isValid(laundryId)) {
      filter.laundryId = laundryId;
    }

    if (paymentStatus === "paid") {
      filter.isPaid = true;
    } else if (paymentStatus === "unpaid") {
      filter.isPaid = false;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { phone: searchRegex }, { email: searchRegex }],
      }).select("_id");
      const matchedLaundries = await Laundry.find({ name: searchRegex }).select("_id");

      const userIds = matchedUsers.map((u) => u._id);
      const laundryIds = matchedLaundries.map((l) => l._id);

      const searchOr = [
        { user: { $in: userIds } },
        { laundryId: { $in: laundryIds } },
      ];

      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        searchOr.push({ _id: search.trim() });
      }

      filter.$or = searchOr;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

    const orders = await Order.find(filter)
      .populate("user", "name email phone")
      .populate("laundryId", "name city address phone")
      .populate("deliveryPartner", "name phone")
      .populate("services.service", "name price estimatedHours")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Order.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: orders,
    });
  } catch (error) {
    console.error("GetAllOrders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Single order detail (SuperAdmin)
// @route   GET /api/super-admin/orders/:id
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID format",
      });
    }

    const order = await Order.findById(id)
      .populate("user", "name email phone role createdAt")
      .populate("laundryId", "name city address phone email status commissionPercent")
      .populate("deliveryPartner", "name phone email currentLocation isAvailable")
      .populate("services.service", "name price category estimatedHours")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const payment = await Payment.findOne({ order: id }).lean();

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        paymentInfo: payment || null,
      },
    });
  } catch (error) {
    console.error("GetOrderById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch order details. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Platform ke saare payments/commission
// @route   GET /api/super-admin/payments
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getAllPayments = async (req, res) => {
  try {
    const { status, method, laundryId, search, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (laundryId && mongoose.Types.ObjectId.isValid(laundryId)) filter.laundryId = laundryId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { phone: searchRegex }],
      }).select("_id");
      const matchedLaundries = await Laundry.find({ name: searchRegex }).select("_id");

      filter.$or = [
        { user: { $in: matchedUsers.map((u) => u._id) } },
        { laundryId: { $in: matchedLaundries.map((l) => l._id) } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

    const payments = await Payment.find(filter)
      .populate("order", "totalAmount status")
      .populate("user", "name phone email")
      .populate("laundryId", "name city")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Payment.countDocuments(filter);

    const commissionData = await Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, totalCommission: { $sum: "$commissionAmount" } } },
    ]);

    return res.status(200).json({
      success: true,
      count: payments.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalCommission: commissionData[0]?.totalCommission || 0,
      data: payments,
    });
  } catch (error) {
    console.error("GetAllPayments error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payments. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Single payment transaction detail
// @route   GET /api/super-admin/payments/:id
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getPaymentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Payment ID format",
      });
    }

    const payment = await Payment.findById(req.params.id)
      .populate("order", "services status totalAmount commissionAmount laundryEarning isPaid paymentMethod createdAt")
      .populate("user", "name phone email role")
      .populate("laundryId", "name phone email city address status")
      .lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("GetPaymentById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment details. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Platform-wide analytics & metrics
// @route   GET /api/super-admin/analytics
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const orderStatusBreakdown = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Order.aggregate([
      { $match: { isPaid: true, status: { $ne: "cancelled" }, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: { $sum: "$totalAmount" },
          totalCommission: { $sum: "$commissionAmount" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const topLaundries = await Laundry.find({ status: "active" })
      .select("name city totalRevenue totalOrders rating")
      .sort({ totalRevenue: -1 })
      .limit(5)
      .lean();

    const cityDistribution = await Laundry.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const paymentMethodBreakdown = await Payment.aggregate([
      { $group: { _id: "$method", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orderStatusBreakdown,
        monthlyTrends,
        topLaundries,
        cityDistribution,
        paymentMethodBreakdown,
      },
    });
  } catch (error) {
    console.error("GetAnalytics error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to calculate analytics data. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Generate report data summary
// @route   GET /api/super-admin/reports
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const revenueFilter = { ...filter, isPaid: true, status: { $ne: "cancelled" } };
    if (filter.createdAt) {
      delete revenueFilter.createdAt;
      revenueFilter.$or = [
        { paidAt: filter.createdAt },
        { paidAt: null, createdAt: filter.createdAt },
      ];
    }

    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      revenueAgg,
      commissionAgg,
      newUsers,
      newLaundries,
    ] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ ...filter, status: "delivered" }),
      Order.countDocuments({ ...filter, status: "cancelled" }),
      Order.aggregate([
        { $match: revenueFilter },
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
                      "$totalAmount",
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
        { $match: revenueFilter },
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
                $cond: [
                  {
                    $gt: [
                      {
                        $ifNull: [
                          "$refundAmount",
                          { $ifNull: [{ $arrayElemAt: ["$paymentDocs.refundAmount", 0] }, 0] },
                        ],
                      },
                      0,
                    ],
                  },
                  {
                    $round: [
                      {
                        $multiply: [
                          {
                            $max: [
                              0,
                              {
                                $subtract: [
                                  "$totalAmount",
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
                          {
                            $divide: [
                              { $ifNull: ["$commissionAmount", 0] },
                              { $cond: [{ $gt: ["$totalAmount", 0] }, "$totalAmount", 1] },
                            ],
                          },
                        ],
                      },
                      2,
                    ],
                  },
                  "$commissionAmount",
                ],
              },
            },
          },
        },
      ]),
      User.countDocuments(filter),
      Laundry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        period: { startDate: startDate || "all", endDate: endDate || "now" },
        summary: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue: revenueAgg[0]?.total || 0,
          totalCommission: commissionAgg[0]?.total || 0,
          newUsers,
          newLaundries,
        },
      },
    });
  } catch (error) {
    console.error("GetReports error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to generate reports. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    SuperAdmin account banao (sirf ek baar)
// @route   POST /api/super-admin/create
// @access  Public (first time only)
// ─────────────────────────────────────────────
const createSuperAdmin = async (req, res) => {
  try {
    const superAdminExists = await User.findOne({ role: "superadmin" });
    if (superAdminExists) {
      return res.status(400).json({
        success: false,
        message: "SuperAdmin already exists",
      });
    }

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const superAdmin = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "superadmin",
      isVerified: true,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "SuperAdmin created successfully",
      data: {
        _id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
      },
    });
  } catch (error) {
    console.error("CreateSuperAdmin error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create SuperAdmin. Please try again.",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  getAllLaundries,
  approveLaundry,
  rejectLaundry,
  suspendLaundry,
  updateCommission,
  getAllUsers,
  getUserById,
  toggleUserStatus,
  getAllOrders,
  getOrderById,
  getAllPayments,
  getPaymentById,
  getAnalytics,
  getReports,
  createSuperAdmin,
};