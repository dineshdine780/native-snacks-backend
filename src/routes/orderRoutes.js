const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");

// Create new order (Public - customer orders)
router.post("/", createOrder);

// Get all orders (Admin only)
router.get("/", authMiddleware, getOrders);

// Update order status (Admin only)
router.patch("/:id/status", authMiddleware, updateOrderStatus);

module.exports = router;