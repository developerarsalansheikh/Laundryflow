const Notification = require("../models/notificationModels");

// ─────────────────────────────────────────────
// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
// ─────────────────────────────────────────────
const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const isSuperAdmin = req.user.role === "superadmin";
    const query = isSuperAdmin ? {} : { user: req.user._id };

    const notifications = await Notification.find(query)
      .populate("user", "name role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadQuery = isSuperAdmin ? { isRead: false } : { user: req.user._id, isRead: false };
    const unreadCount = await Notification.countDocuments(unreadQuery);

    return res.status(200).json({
      success: true,
      message: "Notifications successfully fetched",
      count: notifications.length,
      total,
      pages: Math.ceil(total / limit),
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error("GetMyNotifications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// ─────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === "superadmin";
    const query = isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };

    const notification = await Notification.findOneAndUpdate(
      query,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification read mark ho gayi",
      data: notification,
    });
  } catch (error) {
    console.error("MarkAsRead error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to mark notification as read. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
// ─────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === "superadmin";
    const query = isSuperAdmin ? { isRead: false } : { user: req.user._id, isRead: false };

    await Notification.updateMany(
      query,
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "Saari notifications read mark ho gayi hain",
      data: {},
    });
  } catch (error) {
    console.error("MarkAllAsRead error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to mark notifications as read. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteNotification = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === "superadmin";
    const query = isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };

    const notification = await Notification.findOneAndDelete(query);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification delete ho gayi",
      data: {},
    });
  } catch (error) {
    console.error("DeleteNotification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete notification. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
// ─────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === "superadmin";
    const query = isSuperAdmin ? { isRead: false } : { user: req.user._id, isRead: false };

    const unreadCount = await Notification.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Unread count successfully fetched",
      data: { unreadCount },
    });
  } catch (error) {
    console.error("GetUnreadCount error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch unread count. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Register device token for push notifications
// @route   POST /api/notifications/register-token
// @access  Private
// ─────────────────────────────────────────────
const registerDeviceToken = async (req, res) => {
  try {
    const { token, platform = "android", deviceId = null } = req.body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Device token is required",
      });
    }

    const User = require("../models/userModels");
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Initialize deviceTokens array if not present
    if (!user.deviceTokens) {
      user.deviceTokens = [];
    }

    const trimmedToken = token.trim();
    const existingIndex = user.deviceTokens.findIndex(
      (dt) => dt.token === trimmedToken
    );

    if (existingIndex > -1) {
      // Update existing token's timestamp and metadata (prevent duplicate)
      user.deviceTokens[existingIndex].lastUpdated = new Date();
      if (platform) user.deviceTokens[existingIndex].platform = platform;
      if (deviceId) user.deviceTokens[existingIndex].deviceId = deviceId;
    } else {
      // Add new token
      user.deviceTokens.push({
        token: trimmedToken,
        platform: platform || "android",
        deviceId: deviceId || null,
        lastUpdated: new Date(),
      });
    }

    // Also update legacy fcmToken for backward compatibility
    user.fcmToken = trimmedToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Device token registered successfully",
      data: {
        token: trimmedToken,
        platform,
        deviceCount: user.deviceTokens.length,
      },
    });
  } catch (error) {
    console.error("RegisterDeviceToken error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to register device token. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Unregister device token on logout
// @route   POST /api/notifications/unregister-token
// @access  Private
// ─────────────────────────────────────────────
const unregisterDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    const User = require("../models/userModels");
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const trimmedToken = token.trim();
    if (user.deviceTokens && user.deviceTokens.length > 0) {
      user.deviceTokens = user.deviceTokens.filter(
        (dt) => dt.token !== trimmedToken
      );
    }

    if (user.fcmToken === trimmedToken) {
      user.fcmToken = null;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Device token unregistered successfully",
    });
  } catch (error) {
    console.error("UnregisterDeviceToken error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to unregister device token. Please try again.",
      error: error.message,
    });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  registerDeviceToken,
  unregisterDeviceToken,
};
