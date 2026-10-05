const express = require("express");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentByOrder,
  getAllPayments,
  confirmCODPayment,
  initiateRefund,
  handleWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

// Webhook endpoint (unprotected, verified internally by Razorpay signature)
router.post("/webhook", handleWebhook); // POST /api/payments/webhook

router.use(protect);

// ── User routes ───────────────────────────────
router.post("/create-order", createPaymentOrder);   // POST /api/payments/create-order
router.post("/verify", verifyPayment);              // POST /api/payments/verify
router.get("/:orderId", getPaymentByOrder);         // GET  /api/payments/:orderId

// ── Admin/Delivery routes ─────────────────────
router.put("/confirm-cod/:orderId", confirmCODPayment); // PUT /api/payments/confirm-cod/:orderId
router.post("/refund/:orderId", restrictTo("admin", "superadmin"), initiateRefund); // POST /api/payments/refund/:orderId
router.get("/", restrictTo("admin", "superadmin"), getAllPayments); // GET  /api/payments

module.exports = router;