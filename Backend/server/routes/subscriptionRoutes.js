const express = require("express");
const {
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionStats,
  createSubscription,
  activateSubscription,
  cancelSubscription,
  renewSubscription,
} = require("../controllers/subscriptionController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// All subscription management endpoints are SuperAdmin only
router.use(protect, restrictTo("superadmin"));

// IMPORTANT: /stats MUST be declared before /:id to prevent Express
// from treating "stats" as an ObjectId parameter.
// GET  /api/super-admin/subscriptions/stats       — platform-wide subscription stats
router.get("/subscriptions/stats", getSubscriptionStats);

// GET  /api/super-admin/subscriptions             — list all subscriptions (paginated, filtered)
// POST /api/super-admin/subscriptions             — create new subscription (assign plan to laundry)
router.route("/subscriptions").get(getAllSubscriptions).post(createSubscription);

// GET /api/super-admin/subscriptions/:id          — subscription detail
router.get("/subscriptions/:id", getSubscriptionById);

// Lifecycle actions
// PUT /api/super-admin/subscriptions/:id/activate
router.put("/subscriptions/:id/activate", activateSubscription);

// PUT /api/super-admin/subscriptions/:id/cancel
router.put("/subscriptions/:id/cancel", cancelSubscription);

// PUT /api/super-admin/subscriptions/:id/renew
router.put("/subscriptions/:id/renew", renewSubscription);

module.exports = router;
