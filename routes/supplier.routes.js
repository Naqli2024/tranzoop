const express = require("express");
const router = express.Router();
const controller = require("../controllers/supplier.controller");
const auth = require("../middleware/auth.middleware");

// Add supplier
router.post("/add", auth, controller.addSupplier);

// Get all
router.get("/", auth, controller.getSuppliers);

// Update
router.put("/:id", auth, controller.updateSupplier);

// Delete
router.delete("/:id", auth, controller.deleteSupplier);

// Supplier payment
router.post("/payment", auth, controller.addSupplierPayment);

module.exports = router;