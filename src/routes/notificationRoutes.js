const express = require("express");
const router = express.Router();

const {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

// Get all notifications (Admin only)
router.get("/", authMiddleware, getNotifications);

// Create a notification (Admin only)
router.post("/", authMiddleware, createNotification);

// Mark all notifications as read (Admin only)
router.patch("/read-all", authMiddleware, markAllNotificationsAsRead);

// Mark one notification as read (Admin only)
router.patch("/:id/read", authMiddleware, markNotificationAsRead);

module.exports = router;