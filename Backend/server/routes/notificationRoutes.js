const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  registerDeviceToken,
  unregisterDeviceToken,
} = require("../controllers/notificationController");

const router = express.Router();

// Apply auth protection to all notification routes
router.use(protect);

// ── Device Token Routes ───────────────────────
router.post("/register-token", registerDeviceToken);
router.post("/unregister-token", unregisterDeviceToken);
router.delete("/remove-token", unregisterDeviceToken); // DELETE alias

// ── GET Routes ────────────────────────────────
router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);

// ── PUT Routes ────────────────────────────────
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

// ── DELETE Routes ─────────────────────────────
router.delete("/:id", deleteNotification);

module.exports = router;
