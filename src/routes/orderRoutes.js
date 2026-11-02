const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getMyOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const customerAuthMiddleware = require("../middleware/customerAuthMiddleware");

// Create order - Customer login required
router.post("/", customerAuthMiddleware, createOrder);

// Get only the logged-in customer's orders
router.get("/my-orders", customerAuthMiddleware, getMyOrders);

// Get all orders - Admin only
router.get("/", authMiddleware, getOrders);

// Update order status - Admin only
router.patch("/:id/status", authMiddleware, updateOrderStatus);

module.exports = router;