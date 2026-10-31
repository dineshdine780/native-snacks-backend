const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const Notification = require("../models/Notification");



// Create stock notification
const createStockNotification = async (product) => {
  try {
    let notificationData = null;

    if (product.stock <= 0) {
      notificationData = {
        title: "Out of Stock",
        message: `${product.productName} is out of stock.`,
        type: "outOfStock",
        relatedId: product._id,
      };
    } else if (product.stock <= 10) {
      notificationData = {
        title: "Low Stock",
        message: `${product.productName} has only ${product.stock} items left.`,
        type: "stock",
        relatedId: product._id,
      };
    }

    if (notificationData) {
      await Notification.create(notificationData);
    }
  } catch (error) {
    console.error("Stock notification error:", error.message);
  }
};



// Create Product
const createProduct = async (req, res) => {
  try {
    const {
      productName,
      category,
      price,
      stock,
      description,
      image,
    } = req.body;

    if (!productName || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product name, category and price are required",
      });
    }

    const product = await Product.create({
      productName,
      category,
      price,
      stock,
      description,
      image,
    });

    await createStockNotification(product);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Upload Product Image
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "native-snacks/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "Image upload failed",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Image uploaded successfully",
          imageUrl: result.secure_url,
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Low Stock Products
const getLowStockProducts = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;

    const products = await Product.find({
      stock: { $lte: threshold },
    }).sort({ stock: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      productName,
      category,
      price,
      stock,
      description,
      image,
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        productName,
        category,
        price,
        stock,
        description,
        image,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await createStockNotification(product);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  uploadProductImage,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};
