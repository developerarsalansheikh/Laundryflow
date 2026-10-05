const PlatformSettings = require("../models/settingsModels");

// ─────────────────────────────────────────────
// @desc    Get platform settings (singleton)
// @route   GET /api/super-admin/settings
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getPlatformSettings = async (req, res) => {
  try {
    // Ensure singleton — upsert a default document if none exists
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error("GetPlatformSettings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve platform settings",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Update platform settings
// @route   PUT /api/super-admin/settings
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const updatePlatformSettings = async (req, res) => {
  try {
    const ALLOWED_FIELDS = [
      "platformName",
      "defaultCommissionPercent",
      "currency",
      "supportEmail",
      "supportPhone",
      "maintenanceMode",
      "autoApproveLaundries",
      "minOrderAmount",
    ];

    const updateData = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (
      updateData.defaultCommissionPercent !== undefined &&
      (updateData.defaultCommissionPercent < 0 || updateData.defaultCommissionPercent > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Commission percent must be between 0 and 100",
      });
    }

    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create(updateData);
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error("UpdatePlatformSettings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update platform settings",
      error: error.message,
    });
  }
};

module.exports = {
  getPlatformSettings,
  updatePlatformSettings,
};
