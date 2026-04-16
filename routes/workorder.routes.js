const express = require("express");
const router = express.Router();
const controller = require("../controllers/workorder.controller");
const auth = require("../middleware/auth.middleware");

// CREATE WORK ORDER
router.post("/create", auth, controller.createWorkOrder);

// UPDATE
router.put("/:woNumber", auth, controller.updateWorkOrder);

// GET BY WO NUMBER
router.get("/:woNumber", auth, controller.getWorkOrderByNumber);

// GET BY CUSTOMER
router.get("/customer/:customerId", auth, controller.getOrdersByCustomer);

// GET ALL (BUSINESS)
router.get("/", auth, controller.getOrdersByBusiness);

// DELETE
router.delete("/:woNumber", auth, controller.deleteWorkOrder);

module.exports = router;