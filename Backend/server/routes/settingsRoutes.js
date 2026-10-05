const express = require("express");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  getPlatformSettings,
  updatePlatformSettings,
} = require("../controllers/settingsController");

const router = express.Router();

router.use(protect, restrictTo("superadmin"));

router.get("/", getPlatformSettings);       // GET /api/super-admin/settings
router.put("/", updatePlatformSettings);    // PUT /api/super-admin/settings

module.exports = router;
