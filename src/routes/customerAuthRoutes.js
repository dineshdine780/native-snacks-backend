const express = require("express");

const {
  registerCustomer,
  loginCustomer,
} = require("../controllers/customerAuthController");

const router = express.Router();

// Customer Registration
router.post("/register", registerCustomer);

// Customer Login
router.post("/login", loginCustomer);

module.exports = router;