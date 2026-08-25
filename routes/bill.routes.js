const express = require("express");
const router = express.Router();
const controller = require("../controllers/bill.controller");
const auth = require("../middleware/auth.middleware");

// Create Bill
router.post("/create", auth, controller.createBill);
router.post("/from-workorder", auth, controller.createBillFromWorkOrder);

// Get All Bills
router.get("/", auth, controller.getBills);

// Get Single Bill
router.get("/:id", auth, controller.getBillById);

// Bill By CustomerId
router.get("/customer/:customerId", auth, controller.getBillsByCustomerId);

// Bill By BillNo
router.get("/:billNo", auth, controller.getBillByBillNo);

router.post("/invoice/by-billno", controller.getInvoiceByBillNo);

// Edit ONLY Bill Date
router.put("/edit-date", auth, controller.editBillDate);

router.delete("/:billId", auth, controller.deleteBill);

module.exports = router;