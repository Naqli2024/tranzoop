const express = require("express");
const router = express.Router();
const controller = require("../controllers/payment.controller");
const auth = require("../middleware/auth.middleware");

router.post("/add", auth, controller.addPayment);
router.get("/:billId", auth, controller.getPaymentsByBill);

module.exports = router;