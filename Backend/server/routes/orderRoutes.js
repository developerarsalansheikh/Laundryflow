const express = require("express");
const { restrictTo, protect } = require("../middleware/authMiddleware");
const {
  placeOrder,
  getOrderById,
  cancelOrder,
  changeOrderAddress,
  getAllOrders,
  updateOrderStatus,
  confirmCustomerDelivery,
  reportCustomerUnavailable,
  assignDeliveryPartner,
  getNearbyDriversForOrder,
  autoAssignOrder,
  uploadPickupPhoto,
} = require("../controllers/orderController");
const { pickupPhotoUpload } = require("../middleware/upload.middleware");

const router = express.Router();

// ── User routes (login required) ────────────────
router.use(protect); // all routes protected

router.post("/", placeOrder);                                 // POST  /api/orders — new order
router.get("/:id", getOrderById);                             // GET   /api/orders/:id — single order details
router.put("/:id/address", changeOrderAddress);               // PUT   /api/orders/:id/address — change order address (before pickup)
router.put("/:id/cancel", cancelOrder);                       // PUT   /api/orders/:id/cancel — cancel order (before pickup only)
router.put("/:id/confirm-delivery", confirmCustomerDelivery); // PUT   /api/orders/:id/confirm-delivery — customer confirms delivery
router.put("/:id/unavailable", reportCustomerUnavailable);    // PUT   /api/orders/:id/unavailable — customer/driver unavailable
router.put("/:id/reschedule", reportCustomerUnavailable);     // PUT   /api/orders/:id/reschedule — alias for delivery reschedule

// ── Pickup photo upload (Delivery partner / Admin) ──
router.post(
  "/:id/pickup-photo",
  restrictTo("delivery", "admin", "superadmin"),
  pickupPhotoUpload.single("photo"),
  uploadPickupPhoto
);                                                            // POST  /api/orders/:id/pickup-photo

// ── Shared role status update (Role-enforced inside controller) ──
router.put("/:id/status", restrictTo("admin", "delivery", "superadmin", "user"), updateOrderStatus); // PUT /api/orders/:id/status

// ── Admin routes ───────────────────────────────
router.get("/", restrictTo("admin", "superadmin"), getAllOrders);                               // GET   /api/orders — all orders
router.put("/:id/assign-delivery", restrictTo("admin"), assignDeliveryPartner);                  // PUT   /api/orders/:id/assign-delivery
router.post("/:id/auto-assign", restrictTo("admin", "superadmin"), autoAssignOrder);            // POST  /api/orders/:id/auto-assign
router.get("/:id/nearby-drivers", restrictTo("admin", "superadmin"), getNearbyDriversForOrder); // GET   /api/orders/:id/nearby-drivers

module.exports = router;
