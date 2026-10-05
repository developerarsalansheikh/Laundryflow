const mongoose = require("mongoose");
const Subscription = require("../models/subscriptionModels");
const SubscriptionPlan = require("../models/subscriptionPlanModels");
const Laundry = require("../models/laundryModels");
const { SUBSCRIPTION_STATUS } = require("../constants/subscriptionStatus");
const {
  isExpired,
  validateLifecycleTransition,
  markExpiredSubscriptions,
  syncLaundrySubscriptionFields,
} = require("../utils/subscriptionHelpers");

// ── Shared populate config ────────────────────
// Whitelists only safe, non-sensitive fields
const LAUNDRY_SELECT = "name city state address phone email status commissionPercent";
const OWNER_SELECT = "name email phone";
const PLAN_SELECT = "name slug billingCycle price currency features isActive";

// ── Helper: safe ObjectId validation ─────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─────────────────────────────────────────────
// @desc    Saari subscriptions dekho (paginated, filtered)
// @route   GET /api/super-admin/subscriptions
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getAllSubscriptions = async (req, res) => {
  try {
    // Run expiry sync before returning data
    await markExpiredSubscriptions();

    const {
      search,
      status,
      planId,
      laundryId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    // ── Build base filter ─────────────────────
    const filter = {};

    if (status) {
      const validStatuses = Object.values(SUBSCRIPTION_STATUS);
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${validStatuses.join(", ")}`,
        });
      }
      filter.status = status;
    }

    if (planId) {
      if (!isValidId(planId)) {
        return res.status(400).json({ success: false, message: "Invalid Plan ID format" });
      }
      filter.plan = new mongoose.Types.ObjectId(planId);
    }

    if (laundryId) {
      if (!isValidId(laundryId)) {
        return res.status(400).json({ success: false, message: "Invalid Laundry ID format" });
      }
      filter.laundry = new mongoose.Types.ObjectId(laundryId);
    }

    // ── Date range on startDate ───────────────
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        const sd = new Date(startDate);
        if (isNaN(sd.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid start date format" });
        }
        filter.startDate.$gte = sd;
      }
      if (endDate) {
        const ed = new Date(endDate);
        if (isNaN(ed.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid end date format" });
        }
        filter.startDate.$lte = ed;
      }
    }

    // ── Search: requires JOIN — find matching laundry IDs first ──
    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      // Search laundries by name
      const matchingLaundries = await Laundry.find({
        $or: [{ name: searchRegex }, { city: searchRegex }],
      })
        .select("_id")
        .lean();

      const laundryIds = matchingLaundries.map((l) => l._id);

      // Search plans by name/slug
      const matchingPlans = await SubscriptionPlan.find({
        $or: [{ name: searchRegex }, { slug: searchRegex }],
      })
        .select("_id")
        .lean();

      const planIds = matchingPlans.map((p) => p._id);

      // Combine search conditions — laundry match OR plan match
      const searchFilter = [];
      if (laundryIds.length) searchFilter.push({ laundry: { $in: laundryIds } });
      if (planIds.length) searchFilter.push({ plan: { $in: planIds } });

      if (searchFilter.length === 0) {
        // No matching laundries or plans — return empty
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          pages: 0,
          currentPage: pageNum,
          data: [],
        });
      }

      filter.$or = searchFilter;
    }

    // ── Execute query ─────────────────────────
    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate({
          path: "laundry",
          select: LAUNDRY_SELECT,
          populate: { path: "owner", select: OWNER_SELECT },
        })
        .populate({ path: "plan", select: PLAN_SELECT })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: subscriptions,
    });
  } catch (error) {
    console.error("getAllSubscriptions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch subscriptions. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Ek subscription ki detail
// @route   GET /api/super-admin/subscriptions/:id
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getSubscriptionById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Subscription ID format" });
    }

    const subscription = await Subscription.findById(req.params.id)
      .populate({
        path: "laundry",
        select: LAUNDRY_SELECT,
        populate: { path: "owner", select: OWNER_SELECT },
      })
      .populate({ path: "plan", select: PLAN_SELECT })
      .lean();

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    // Attach computed expiry flag
    subscription.isExpiredNow = isExpired(subscription);

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("getSubscriptionById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch subscription. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Subscription stats
// @route   GET /api/super-admin/subscriptions/stats
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getSubscriptionStats = async (req, res) => {
  try {
    // Update expired records before computing stats
    await markExpiredSubscriptions();

    const [statusCounts, revenueAgg] = await Promise.all([
      // Count per status
      Subscription.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Revenue broken down by billingCycle (via plan join)
      Subscription.aggregate([
        {
          $match: {
            status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.PAST_DUE] },
          },
        },
        {
          $lookup: {
            from: "subscriptionplans",
            localField: "plan",
            foreignField: "_id",
            as: "planData",
          },
        },
        { $unwind: { path: "$planData", preserveNullAndEmpty: false } },
        {
          $group: {
            _id: "$planData.billingCycle",
            revenue: { $sum: "$price" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // ── Build status map ──────────────────────
    const statusMap = {};
    statusCounts.forEach(({ _id, count }) => {
      statusMap[_id] = count;
    });

    const totalSubscriptions =
      Object.values(statusMap).reduce((acc, val) => acc + val, 0);

    // ── Build revenue map ─────────────────────
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
    revenueAgg.forEach(({ _id, revenue }) => {
      if (_id === "monthly") monthlyRevenue = revenue;
      if (_id === "yearly") yearlyRevenue = revenue;
    });

    // Total lifetime revenue from all subscriptions
    const totalRevenueAgg = await Subscription.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);
    const totalSubscriptionRevenue = totalRevenueAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalSubscriptions,
        trialSubscriptions: statusMap[SUBSCRIPTION_STATUS.TRIAL] || 0,
        activeSubscriptions: statusMap[SUBSCRIPTION_STATUS.ACTIVE] || 0,
        pastDueSubscriptions: statusMap[SUBSCRIPTION_STATUS.PAST_DUE] || 0,
        cancelledSubscriptions: statusMap[SUBSCRIPTION_STATUS.CANCELLED] || 0,
        expiredSubscriptions: statusMap[SUBSCRIPTION_STATUS.EXPIRED] || 0,
        monthlyRevenue,
        yearlyRevenue,
        totalSubscriptionRevenue,
      },
    });
  } catch (error) {
    console.error("getSubscriptionStats error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch subscription stats. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Naya subscription banao (SuperAdmin assigns plan to laundry)
// @route   POST /api/super-admin/subscriptions
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const createSubscription = async (req, res) => {
  try {
    const {
      laundryId,
      planId,
      startDate,
      endDate,
      status,
      autoRenew,
      notes,
    } = req.body;

    // ── Required validation ───────────────────
    if (!laundryId || !isValidId(laundryId)) {
      return res.status(400).json({ success: false, message: "Valid laundryId is required" });
    }
    if (!planId || !isValidId(planId)) {
      return res.status(400).json({ success: false, message: "Valid planId is required" });
    }
    if (!startDate) {
      return res.status(400).json({ success: false, message: "startDate is required" });
    }
    if (!endDate) {
      return res.status(400).json({ success: false, message: "endDate is required" });
    }

    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (isNaN(sd.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid start date format" });
    }
    if (isNaN(ed.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid end date format" });
    }
    if (ed <= sd) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    // ── Validate status if provided ───────────
    const initialStatus = status || SUBSCRIPTION_STATUS.TRIAL;
    if (!Object.values(SUBSCRIPTION_STATUS).includes(initialStatus)) {
      return res.status(400).json({ success: false, message: "Invalid subscription status" });
    }

    // ── Verify laundry exists ─────────────────
    const laundry = await Laundry.findById(laundryId).lean();
    if (!laundry) {
      return res.status(404).json({ success: false, message: "Laundry store not found" });
    }

    // ── Verify plan exists and is active ─────
    const plan = await SubscriptionPlan.findById(planId).lean();
    if (!plan) {
      return res.status(404).json({ success: false, message: "Subscription plan not found" });
    }
    if (!plan.isActive) {
      return res.status(400).json({ success: false, message: "This subscription plan is not active" });
    }

    // ── Check for existing active/trial subscription ──
    const existingActive = await Subscription.findOne({
      laundry: laundryId,
      status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL, SUBSCRIPTION_STATUS.PAST_DUE] },
    });
    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: "An active or trial subscription already exists for this laundry store",
      });
    }

    // ── Create subscription ───────────────────
    const subscription = await Subscription.create({
      laundry: laundryId,
      plan: planId,
      status: initialStatus,
      startDate: sd,
      endDate: ed,
      autoRenew: Boolean(autoRenew),
      price: plan.price,
      currency: plan.currency || "INR",
      notes: notes ? String(notes).trim() : "",
      ...(initialStatus === SUBSCRIPTION_STATUS.TRIAL && {
        trialStartDate: sd,
        trialEndDate: ed,
      }),
    });

    // ── Sync laundry subscription fields ─────
    await syncLaundrySubscriptionFields(laundryId, subscription);

    const populated = await Subscription.findById(subscription._id)
      .populate({ path: "laundry", select: LAUNDRY_SELECT, populate: { path: "owner", select: OWNER_SELECT } })
      .populate({ path: "plan", select: PLAN_SELECT })
      .lean();

    return res.status(201).json({
      success: true,
      message: "Subscription successfully banai gayi",
      data: populated,
    });
  } catch (error) {
    console.error("createSubscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create subscription. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Subscription activate karo
// @route   PUT /api/super-admin/subscriptions/:id/activate
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const activateSubscription = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Subscription ID format" });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    if (!validateLifecycleTransition(subscription.status, SUBSCRIPTION_STATUS.ACTIVE)) {
      return res.status(400).json({
        success: false,
        message: `'${subscription.status}' to 'active' transition is not allowed`,
      });
    }

    subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
    await subscription.save();

    await syncLaundrySubscriptionFields(subscription.laundry, subscription);

    const populated = await Subscription.findById(subscription._id)
      .populate({ path: "laundry", select: LAUNDRY_SELECT, populate: { path: "owner", select: OWNER_SELECT } })
      .populate({ path: "plan", select: PLAN_SELECT })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Subscription activate ho gayi",
      data: populated,
    });
  } catch (error) {
    console.error("activateSubscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to activate subscription. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Subscription cancel karo
// @route   PUT /api/super-admin/subscriptions/:id/cancel
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const cancelSubscription = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Subscription ID format" });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    if (!validateLifecycleTransition(subscription.status, SUBSCRIPTION_STATUS.CANCELLED)) {
      return res.status(400).json({
        success: false,
        message: `'${subscription.status}' to 'cancelled' transition is not allowed`,
      });
    }

    const { cancelReason } = req.body;

    subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancelReason = cancelReason ? String(cancelReason).trim() : "";
    await subscription.save();

    await syncLaundrySubscriptionFields(subscription.laundry, subscription);

    const populated = await Subscription.findById(subscription._id)
      .populate({ path: "laundry", select: LAUNDRY_SELECT, populate: { path: "owner", select: OWNER_SELECT } })
      .populate({ path: "plan", select: PLAN_SELECT })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Subscription cancel ho gayi",
      data: populated,
    });
  } catch (error) {
    console.error("cancelSubscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to cancel subscription. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Subscription renew karo (extend endDate)
// @route   PUT /api/super-admin/subscriptions/:id/renew
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const renewSubscription = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Subscription ID format" });
    }

    const subscription = await Subscription.findById(req.params.id)
      .populate({ path: "plan", select: "billingCycle price currency" });

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    // Renewal is allowed from: active, past_due, expired (re-activation)
    const renewableStatuses = [
      SUBSCRIPTION_STATUS.ACTIVE,
      SUBSCRIPTION_STATUS.PAST_DUE,
      SUBSCRIPTION_STATUS.EXPIRED,
    ];
    if (!renewableStatuses.includes(subscription.status)) {
      return res.status(400).json({
        success: false,
        message: `Subscription with status '${subscription.status}' cannot be renewed`,
      });
    }

    // ── Calculate new endDate ─────────────────
    const { newEndDate } = req.body;
    let updatedEndDate;

    if (newEndDate) {
      updatedEndDate = new Date(newEndDate);
      if (isNaN(updatedEndDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid new end date format" });
      }
    } else {
      // Auto-calculate from current endDate or now
      const base = subscription.endDate > new Date()
        ? subscription.endDate
        : new Date();

      const cycle = subscription.plan?.billingCycle;
      if (cycle === "yearly") {
        updatedEndDate = new Date(base);
        updatedEndDate.setFullYear(updatedEndDate.getFullYear() + 1);
      } else {
        // monthly (default)
        updatedEndDate = new Date(base);
        updatedEndDate.setMonth(updatedEndDate.getMonth() + 1);
      }
    }

    if (updatedEndDate <= subscription.startDate) {
      return res.status(400).json({
        success: false,
        message: "New end date must be after start date",
      });
    }

    subscription.endDate = updatedEndDate;
    subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
    await subscription.save();

    await syncLaundrySubscriptionFields(subscription.laundry, subscription);

    const populated = await Subscription.findById(subscription._id)
      .populate({ path: "laundry", select: LAUNDRY_SELECT, populate: { path: "owner", select: OWNER_SELECT } })
      .populate({ path: "plan", select: PLAN_SELECT })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Subscription renew ho gayi",
      data: populated,
    });
  } catch (error) {
    console.error("renewSubscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to renew subscription. Please try again.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionStats,
  createSubscription,
  activateSubscription,
  cancelSubscription,
  renewSubscription,
};
