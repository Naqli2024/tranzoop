const express = require("express");
const router = express.Router();
const controller = require("../controllers/erp.controller");

// Create ERP (admin use)
router.post("/erp/create", controller.createERP);

// Get all ERP (marketplace screen)
router.get("/erp/all", controller.getAllERP);

// Get ERP by key (dynamic form)
router.get("/erp/:key", controller.getERPByKey);

module.exports = router;