const Order = require("../models/Order");
const Product = require("../models/Product");
const Notification = require("../models/Notification");

// Create Order
// Create Order
const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod,
      items,
      notes,
    } = req.body;

    // Validate customer details
    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof customerPhone !== "string" ||
      !customerPhone.trim() ||
      typeof customerAddress !== "string" ||
      !customerAddress.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name, phone, address and order items are required",
      });
    }

    // Only Cash on Delivery is supported for now
    if (paymentMethod && paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Validate and combine identical product + weight entries
    const quantityMap = new Map();

    for (const item of items) {
      const quantity = Number(item.quantity);
      const selectedWeight = Number(item.selectedWeight);

      if (
        !item.product ||
        !/^[a-f\d]{24}$/i.test(String(item.product)) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        ![250, 500, 1000, 2000].includes(selectedWeight)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each item needs a valid product ID, quantity and weight",
        });
      }

      const productId = String(item.product);
      const key = `${productId}-${selectedWeight}`;

      const existing = quantityMap.get(key);

      quantityMap.set(key, {
        productId,
        selectedWeight,
        quantity: (existing?.quantity || 0) + quantity,
      });
    }

    const orderItems = [];
    const stockRequirements = new Map();
    let totalAmount = 0;

    // Validate products and calculate order totals
    for (const item of quantityMap.values()) {
      const {
        productId,
        selectedWeight,
        quantity,
      } = item;

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "A product in this order was not found",
        });
      }

      // Stock is measured in grams
      const requiredStock = selectedWeight * quantity;
      const alreadyRequired =
        stockRequirements.get(productId) || 0;

      stockRequirements.set(
        productId,
        alreadyRequired + requiredStock
      );

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${product.productName}`,
        });
      }

      // Product price is per kilogram
      const pricePerPack = (price * selectedWeight) / 1000;
      const subtotal = Number(
        (pricePerPack * quantity).toFixed(2)
      );

      orderItems.push({
        product: product._id,
        productName: product.productName,
        quantity,
        selectedWeight,
        price,
        subtotal,
      });

      totalAmount += subtotal;
    }

    // Check stock for each product
    for (const [productId, requiredStock] of stockRequirements) {
      const product = await Product.findById(productId);
      


      if (!product || Number(product.stock) < requiredStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${
            product?.productName || "a product"
          }`,
        });
      }
    }

    const orderId = `NS${Date.now()}`;

    // Create order
    const order = await Order.create({
      orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      paymentMethod: paymentMethod || "COD",
      items: orderItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    // Reduce stock in grams
    for (const [productId, requiredStock] of stockRequirements) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          stock: { $gte: requiredStock },
        },
        {
          $inc: { stock: -requiredStock },
        },
        { new: true }
      );

      if (!updatedProduct) {
        // Roll back stock already reduced for this order
        for (const [rollbackId, rollbackAmount] of stockRequirements) {
          if (String(rollbackId) === String(productId)) break;

          await Product.updateOne(
            { _id: rollbackId },
            { $inc: { stock: rollbackAmount } }
          );
        }

        await Order.findByIdAndDelete(order._id);

        return res.status(409).json({
          success: false,
          message: "Stock changed while processing. Please try again.",
        });
      }
    }

    // Create notification after successful order creation
    try {
      await Notification.create({
        title: "New Order",
        message: `New order ${order.orderId} received from ${order.customerName}.`,
        type: "order",
        relatedId: order._id,
      });
    } catch (notificationError) {
      console.error(
        "Order notification creation failed:",
        notificationError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Orders
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
};