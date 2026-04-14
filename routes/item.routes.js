const express = require("express");
const router = express.Router();
const controller = require("../controllers/item.controller");
const auth = require("../middleware/auth.middleware");
const upload = require("../middleware/upload");

// Add item (with image)
router.post("/add", auth, upload.single("itemImage"), controller.addItem);

// Get all items
router.get("/all", auth, controller.getAllItems);

// Update item
router.put("/:id", auth, upload.single("itemImage"), controller.updateItem);

// Delete item
router.delete("/:id", auth, controller.deleteItem);

// Add Favorite
router.put("/favorite/:itemId", auth, controller.toggleFavorite);

// View count
router.put("/view/:itemId", auth, controller.incrementView);

// Search count
router.get("/search", auth, controller.searchItems);

module.exports = router;