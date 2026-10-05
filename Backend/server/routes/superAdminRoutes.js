const express = require("express");
const {
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
} = require("../controllers/superAdminController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// ── One time only — SuperAdmin create ─────────
router.post("/create", createSuperAdmin); // POST /api/super-admin/create

// ── SuperAdmin only routes ────────────────────
router.use(protect, restrictTo("superadmin")); // sab routes superadmin only

// Dashboard & Analytics
router.get("/dashboard", getDashboard); // GET /api/super-admin/dashboard
router.get("/analytics", getAnalytics); // GET /api/super-admin/analytics
router.get("/reports", getReports); // GET /api/super-admin/reports

// Laundries
router.get("/laundries", getAllLaundries); // GET /api/super-admin/laundries
router.put("/laundries/:id/approve", approveLaundry); // PUT /api/super-admin/laundries/:id/approve
router.put("/laundries/:id/reject", rejectLaundry); // PUT /api/super-admin/laundries/:id/reject
router.put("/laundries/:id/suspend", suspendLaundry); // PUT /api/super-admin/laundries/:id/suspend
router.put("/laundries/:id/commission", updateCommission); // PUT /api/super-admin/laundries/:id/commission

// Users
router.get("/users", getAllUsers); // GET /api/super-admin/users
router.get("/users/:id", getUserById); // GET /api/super-admin/users/:id
router.put("/users/:id/toggle-status", toggleUserStatus); // PUT /api/super-admin/users/:id/toggle-status

// Orders (SuperAdmin Platform-Wide)
router.get("/orders", getAllOrders); // GET /api/super-admin/orders
router.get("/orders/:id", getOrderById); // GET /api/super-admin/orders/:id

// Payments & Financials
router.get("/payments", getAllPayments); // GET /api/super-admin/payments
router.get("/payments/:id", getPaymentById); // GET /api/super-admin/payments/:id

module.exports = router;