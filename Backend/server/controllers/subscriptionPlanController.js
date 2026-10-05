const mongoose = require("mongoose");
const SubscriptionPlan = require("../models/subscriptionPlanModels");
const Subscription = require("../models/subscriptionModels");

// ─────────────────────────────────────────────
// @desc    Saare subscription plans dekho
// @route   GET /api/super-admin/subscription-plans
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getAllPlans = async (req, res) => {
  try {
    const { isActive, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));

    const [plans, total] = await Promise.all([
      SubscriptionPlan.find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      SubscriptionPlan.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: plans.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: plans,
    });
  } catch (error) {
    console.error("getAllPlans error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription plans",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Naya subscription plan banao
// @route   POST /api/super-admin/subscription-plans
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const createPlan = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      currency,
      billingCycle,
      features,
      maxOrders,
      maxEmployees,
      isActive,
      isPopular,
      sortOrder,
    } = req.body;

    // ── Required field validation ─────────────
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Plan name is required" });
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return res.status(400).json({ success: false, message: "Plan slug is required" });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: "Price must be 0 or greater" });
    }
    if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: "Billing cycle must be either 'monthly' or 'yearly'",
      });
    }

    // ── Duplicate slug check ──────────────────
    const existing = await SubscriptionPlan.findOne({
      slug: slug.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Slug '${slug}' already exists. Please choose a different slug.`,
      });
    }

    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      description: description ? String(description).trim() : "",
      price: Number(price),
      currency: currency ? String(currency).toUpperCase().trim() : "INR",
      billingCycle,
      features: Array.isArray(features) ? features.map((f) => String(f).trim()).filter(Boolean) : [],
      maxOrders: maxOrders !== undefined ? Number(maxOrders) : -1,
      maxEmployees: maxEmployees !== undefined ? Number(maxEmployees) : -1,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isPopular: isPopular !== undefined ? Boolean(isPopular) : false,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: plan,
    });
  } catch (error) {
    console.error("createPlan error:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A plan with this slug already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create subscription plan",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Ek plan ki detail
// @route   GET /api/super-admin/subscription-plans/:id
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getPlanById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Plan ID format" });
    }

    const plan = await SubscriptionPlan.findById(req.params.id).lean();
    if (!plan) {
      return res.status(404).json({ success: false, message: "Subscription plan not found" });
    }

    // Count how many subscriptions use this plan
    const subscriptionCount = await Subscription.countDocuments({ plan: plan._id });

    return res.status(200).json({
      success: true,
      data: { ...plan, subscriptionCount },
    });
  } catch (error) {
    console.error("getPlanById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription plan",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Plan update karo
// @route   PUT /api/super-admin/subscription-plans/:id
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const updatePlan = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Plan ID format" });
    }

    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Subscription plan not found" });
    }

    const {
      name,
      slug,
      description,
      price,
      currency,
      billingCycle,
      features,
      maxOrders,
      maxEmployees,
      isActive,
      isPopular,
      sortOrder,
    } = req.body;

    // ── Price validation ──────────────────────
    if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ success: false, message: "Price must be 0 or greater" });
    }

    // ── Billing cycle validation ──────────────
    if (billingCycle !== undefined && !["monthly", "yearly"].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: "Billing cycle must be either 'monthly' or 'yearly'",
      });
    }

    // ── Slug uniqueness check (if slug is changing) ──
    if (slug && slug.toLowerCase().trim() !== plan.slug) {
      const existing = await SubscriptionPlan.findOne({
        slug: slug.toLowerCase().trim(),
        _id: { $ne: plan._id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Slug '${slug}' already exists`,
        });
      }
      plan.slug = slug.toLowerCase().trim();
    }

    // ── Apply updates ─────────────────────────
    if (name !== undefined) plan.name = String(name).trim();
    if (description !== undefined) plan.description = String(description).trim();
    if (price !== undefined) plan.price = Number(price);
    if (currency !== undefined) plan.currency = String(currency).toUpperCase().trim();
    if (billingCycle !== undefined) plan.billingCycle = billingCycle;
    if (features !== undefined) {
      plan.features = Array.isArray(features)
        ? features.map((f) => String(f).trim()).filter(Boolean)
        : [];
    }
    if (maxOrders !== undefined) plan.maxOrders = Number(maxOrders);
    if (maxEmployees !== undefined) plan.maxEmployees = Number(maxEmployees);
    if (isActive !== undefined) plan.isActive = Boolean(isActive);
    if (isPopular !== undefined) plan.isPopular = Boolean(isPopular);
    if (sortOrder !== undefined) plan.sortOrder = Number(sortOrder);

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("updatePlan error:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A plan with this slug already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update subscription plan",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Plan delete karo
// @route   DELETE /api/super-admin/subscription-plans/:id
// @access  Private/SuperAdmin
// @note    Blocked if active subscriptions exist for this plan
// ─────────────────────────────────────────────
const deletePlan = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Plan ID format" });
    }

    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Subscription plan not found" });
    }

    // ── Safety check — cannot delete plan with active subscriptions ──
    const activeSubCount = await Subscription.countDocuments({
      plan: plan._id,
      status: { $in: ["trial", "active", "past_due"] },
    });

    if (activeSubCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete a plan with active subscriptions. ${activeSubCount} subscription(s) still use this plan.`,
      });
    }

    await SubscriptionPlan.findByIdAndDelete(plan._id);

    return res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("deletePlan error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete subscription plan",
      error: error.message,
    });
  }
};

module.exports = {
  getAllPlans,
  createPlan,
  getPlanById,
  updatePlan,
  deletePlan,
};
