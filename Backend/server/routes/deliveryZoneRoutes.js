const express = require("express");
const {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  toggleDeliveryZone,
  deleteDeliveryZone,
  checkDeliveryAvailability,
} = require("../controllers/deliveryZoneController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Customer / Authenticated check
router.post("/check-availability", checkDeliveryAvailability);

// Laundry Admin & Superadmin management
router.get("/", restrictTo("admin", "superadmin"), getDeliveryZones);
router.post("/", restrictTo("admin", "superadmin"), createDeliveryZone);
router.put("/:id", restrictTo("admin", "superadmin"), updateDeliveryZone);
router.patch("/:id/toggle", restrictTo("admin", "superadmin"), toggleDeliveryZone);
router.delete("/:id", restrictTo("admin", "superadmin"), deleteDeliveryZone);

module.exports = router;
