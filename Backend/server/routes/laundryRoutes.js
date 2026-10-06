const express = require("express");
const {
  registerLaundry,
  getMyLaundry,
  updateMyLaundry,
  updateAssignmentMode,
  getLaundryDashboard,
  addDeliveryPartner,
  getDeliveryPartners,
  toggleDeliveryPartner,
  updateDeliveryPartner,
  getAllLaundries,
  getLaundryById,
  addTimeSlot,
  getTimeSlots,
  getAdminTimeSlots,
  getLaundryCustomers,
} = require("../controllers/laundryController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { laundryUpload } = require("../middleware/upload.middleware");

const router = express.Router();

// ── Public routes ─────────────────────────────
router.post("/register", registerLaundry);          // POST /api/laundry/register
router.get("/all", getAllLaundries);                 // GET  /api/laundry/all

// ── Admin routes (laundry owner) ──────────────
router.get("/admin/my-laundry", protect, restrictTo("admin"), getMyLaundry);
router.put("/admin/my-laundry", protect, restrictTo("admin"), laundryUpload.single("logo"), updateMyLaundry);
router.put("/admin/assignment-mode", protect, restrictTo("admin"), updateAssignmentMode);
router.get("/admin/dashboard", protect, restrictTo("admin"), getLaundryDashboard);

// Time Slots management
router.get("/admin/time-slots", protect, restrictTo("admin"), getAdminTimeSlots);  // GET  /api/laundry/admin/time-slots
router.post("/admin/time-slots", protect, restrictTo("admin"), addTimeSlot);       // POST /api/laundry/admin/time-slots

// Delivery partner management
// NOTE: Only SUPERADMIN can CREATE and EDIT delivery agent accounts
router.post("/admin/delivery-partner", protect, restrictTo("superadmin"), addDeliveryPartner);
router.get("/admin/delivery-partners", protect, restrictTo("admin", "superadmin"), getDeliveryPartners);
router.put("/admin/delivery-partner/:id/toggle", protect, restrictTo("admin", "superadmin"), toggleDeliveryPartner);
router.put("/admin/delivery-partner/:id", protect, restrictTo("superadmin"), updateDeliveryPartner);

// Customer management
router.get("/admin/customers", protect, restrictTo("admin"), getLaundryCustomers); // GET  /api/laundry/admin/customers

// Dynamic routes MUST be at the bottom (after all static /admin/* routes)
router.get("/:id/time-slots", getTimeSlots);        // GET  /api/laundry/:id/time-slots (Public slots)
router.get("/:id", getLaundryById);                 // GET  /api/laundry/:id

module.exports = router;