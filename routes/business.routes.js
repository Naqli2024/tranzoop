const express = require("express");
const router = express.Router();
const controller = require("../controllers/business.controller");

// Register business under ERP
router.post("/register/:key", controller.registerBusiness);

// Verify mobile
router.post("/verify-mobile", controller.verifyMobile);

// Get all businesses (admin)
router.get("/", controller.getAllBusinesses);

// Get businesses by ERP (tyre, supermarket)
router.get("/erp/:key", controller.getBusinessesByERP);

// Get single business
router.get("/:id", controller.getBusinessById);

module.exports = router;