const express = require("express");
const {
  getAllPlans,
  createPlan,
  getPlanById,
  updatePlan,
  deletePlan,
} = require("../controllers/subscriptionPlanController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// All plan management endpoints are SuperAdmin only
router.use(protect, restrictTo("superadmin"));

// GET  /api/super-admin/subscription-plans        — list all plans
// POST /api/super-admin/subscription-plans        — create new plan
router.route("/subscription-plans").get(getAllPlans).post(createPlan);

// GET    /api/super-admin/subscription-plans/:id  — get plan detail
// PUT    /api/super-admin/subscription-plans/:id  — update plan
// DELETE /api/super-admin/subscription-plans/:id  — delete plan (409 if active subs)
router
  .route("/subscription-plans/:id")
  .get(getPlanById)
  .put(updatePlan)
  .delete(deletePlan);

module.exports = router;
