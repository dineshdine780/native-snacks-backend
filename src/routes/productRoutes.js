const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  uploadProductImage,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require("../controllers/productController");

const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");

// Create Product
router.post("/", authMiddleware, createProduct);

// Get All Products
router.get("/", getProducts);

// Get Low Stock Products
router.get("/low-stock", authMiddleware, getLowStockProducts);

// Upload Product Image
router.post(
  "/upload-image",
  authMiddleware,
  upload.single("image"),
  uploadProductImage
);

// Update Product
router.put("/:id", authMiddleware, updateProduct);

// Delete Product
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;