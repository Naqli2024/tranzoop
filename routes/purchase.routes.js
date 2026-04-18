const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchase.controller");
const auth = require("../middleware/auth.middleware");

// new purchase
router.post("/add", auth, controller.createPurchase);

// list + filter
router.get("/", auth, controller.getPurchases);

// by purchaseNo (VIEW)
router.get("/:purchaseNo", auth, controller.getPurchaseByNo);

// by supplier
router.get("/supplier/:supplierId", auth, controller.getPurchasesBySupplier);

module.exports = router;