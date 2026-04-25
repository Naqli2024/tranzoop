const express = require("express");
const router = express.Router();
const controller = require("../controllers/ledger.controller");
const auth = require("../middleware/auth.middleware");

// SUMMARY
router.get("/summary", auth, controller.getDashboardSummary);

// AGING
router.get("/aging", auth, controller.getAgingReport);

// CUSTOMER LEDGER
router.get("/customer", auth, controller.getCustomersLedgerSummary);
router.get("/customer/:customerId", auth, controller.getCustomerLedgerById);

// SUPPLIER LEDGER
router.get("/supplier/:supplierId", auth, controller.getSupplierLedger);
router.get("/suppliers", auth, controller.getAllSuppliersLedger);

// ANALYTICS
router.get("/revenue-split", auth, controller.getRevenueSplit);
router.get("/top-services", auth, controller.getTopServices);
router.get("/payment-split", auth, controller.getPaymentSplit);
router.get("/daily-sales", auth, controller.getDailySales);

module.exports = router;