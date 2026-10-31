const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  deleteCategory,
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleware");

// Create Category
router.post("/", authMiddleware, createCategory);

// Get All Categories
router.get("/", authMiddleware, getCategories);

// Delete Category
router.delete("/:id", authMiddleware, deleteCategory);

module.exports = router;