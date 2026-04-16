const express = require("express");
const router = express.Router();
const controller = require("../controllers/customer.controller");
const auth = require("../middleware/auth.middleware");

router.post("/add", auth, controller.addCustomer);
router.get("/", auth, controller.getCustomers);
router.get("/:id", auth, controller.getCustomerById);

module.exports = router;