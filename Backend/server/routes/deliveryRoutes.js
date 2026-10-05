const express = require("express");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  getAvailableOrders,
  acceptOrder,
  rejectOrder,
  getMyActiveOrders,
  getMyCompletedOrders,
  updateDeliveryStatus,
  generateDeliveryOTP,
  verifyDeliveryOTP,
  getMyStats,
  updateLocation,
  updateAvailability,
  createDeliveryPickupOrder,
  getNearbyAvailableOrders,
  selfAssignOrder,
} = require("../controllers/deliveryController");

const router = express.Router();

// Apply protection and restrictTo("delivery") to all endpoints
router.use(protect);
router.use(restrictTo("delivery"));

// GET  /api/delivery/available-orders    → available orders
router.get("/available-orders", getAvailableOrders);

// POST /api/delivery/accept/:orderId     → order accept
router.post("/accept/:orderId", acceptOrder);

// POST /api/delivery/reject/:orderId     → order reject
router.post("/reject/:orderId", rejectOrder);

// GET  /api/delivery/my-active-orders   → active orders
router.get("/my-active-orders", getMyActiveOrders);

// GET  /api/delivery/my-completed-orders → history
router.get("/my-completed-orders", getMyCompletedOrders);

// POST /api/delivery/orders/:id/status  → status update
router.put("/orders/:id/status", updateDeliveryStatus);

// POST /api/delivery/orders/:id/pickup-photo → capture pickup photo
const { uploadPickupPhoto } = require("../controllers/orderController");
const { pickupPhotoUpload } = require("../middleware/upload.middleware");
router.post("/orders/:id/pickup-photo", pickupPhotoUpload.single("photo"), uploadPickupPhoto);

// POST /api/delivery/orders/:id/generate-otp → delivery OTP
router.post("/orders/:id/generate-otp", generateDeliveryOTP);

// POST /api/delivery/orders/:id/verify-otp   → OTP verify
router.post("/orders/:id/verify-otp", verifyDeliveryOTP);

// GET  /api/delivery/stats              → earnings/stats
router.get("/stats", getMyStats);

// POST /api/delivery/update-location    → live location
router.post("/update-location", updateLocation);

// PUT  /api/delivery/availability       → availability status (offline/available/busy)
router.put("/availability", updateAvailability);

// POST /api/delivery/new-pickup         → delivery partner creates new pickup order
router.post("/new-pickup", createDeliveryPickupOrder);

// GET  /api/delivery/nearby-orders       → unassigned pending orders within 10 km
router.get("/nearby-orders", getNearbyAvailableOrders);

// POST /api/delivery/self-assign/:id     → agent self-assigns an unassigned order
router.post("/self-assign/:orderId", selfAssignOrder);

module.exports = router;

