const express = require("express");
const router = express.Router();
const controller = require("../controllers/bill.controller");
const auth = require("../middleware/auth.middleware");

// Create Bill
router.post("/create", auth, controller.createBill);

// Get All Bills
router.get("/", auth, controller.getBills);

// Get Single Bill
router.get("/:id", auth, controller.getBillById);

// Bill By CustomerId
router.get("/customer/:customerId", auth, controller.getBillsByCustomerId);

module.exports = router;