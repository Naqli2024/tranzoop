const fs = require("fs");
const path = require("path");
const Item = require("../models/Item");
// const { uploadToGCS } = require("../utils/gcsUpload");
const { uploadFile } = require("../utils/fileUpload");

// ADD ITEM
exports.addItem = async (req, res) => {
  try {
    const { businessId, erpKey } = req.user;

    const { itemName } = req.body;

    // Basic validation
    if (!itemName) {
      return res.status(400).json({ message: "itemName is required" });
    }

    // Check duplicate
    const existingItem = await Item.findOne({
      businessId,
      itemName: itemName.trim()
    });

    if (existingItem) {
      return res.status(400).json({
        message: "Item already exists with same name"
      });
    }

    let imageUrl = "";

    if (req.file) {
    //   imageUrl = await uploadToGCS(req.file, businessId, erpKey);
    imageUrl = await uploadFile(req.file, businessId, erpKey);
    }

    const item = await Item.create({
      businessId,
      erpKey,
      itemImage: imageUrl,

      itemName: req.body.itemName,
      sku: req.body.sku,
      barCode: req.body.barCode,
      category: req.body.category,
      hsn: req.body.hsn,
      gst: req.body.gst,
      uom: req.body.uom,
      mrp: req.body.mrp,
      cost: req.body.cost,
      margin: req.body.margin,
      openingStock: req.body.openingStock
    });

    res.status(201).json({
      message: "Item created",
      item
    });

  } catch (err) {
    // Handle duplicate index error 
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Item already exists (duplicate)"
      });
    }
    res.status(500).json({ error: err.message });
  }
};

// GET ALL ITEMS
exports.getAllItems = async (req, res) => {
  try {
    const { businessId } = req.user;

    const items = await Item.find({ businessId })
      .sort({
        isFavorite: -1,      // favorites first
        favoriteCount: -1,   // most favorited
        viewCount: -1,       // most viewed
        searchCount: -1,     // most searched
        createdAt: -1        // newest
      });

    res.json(items);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ITEM
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId, erpKey } = req.user;

    const item = await Item.findOne({ _id: id, businessId });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Always make body safe
    const body = req.body || {};

    // =========================
    // HANDLE IMAGE UPDATE
    // =========================
    if (req.file) {
      // Delete old image (if exists)
      if (item.itemImage) {
        const oldPath = path.join(__dirname, "..", item.itemImage);

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Upload new image
      const newImageUrl = await uploadFile(req.file, businessId, erpKey);
      item.itemImage = newImageUrl;
    }

    // =========================
    // UPDATE ONLY PROVIDED FIELDS
    // =========================
    if (body.itemName !== undefined) item.itemName = body.itemName;
    if (body.sku !== undefined) item.sku = body.sku;
    if (body.barCode !== undefined) item.barCode = body.barCode;
    if (body.category !== undefined) item.category = body.category;
    if (body.hsn !== undefined) item.hsn = body.hsn;
    if (body.gst !== undefined) item.gst = body.gst;
    if (body.uom !== undefined) item.uom = body.uom;
    if (body.mrp !== undefined) item.mrp = body.mrp;
    if (body.cost !== undefined) item.cost = body.cost;
    if (body.margin !== undefined) item.margin = body.margin;
    if (body.openingStock !== undefined)
      item.openingStock = body.openingStock;

    await item.save();

    res.json({
      message: "Item updated",
      item,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE ITEM
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId } = req.user;

    const item = await Item.findOneAndDelete({
      _id: id,
      businessId
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// TOGGLE FAVORITE
exports.toggleFavorite = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { itemId } = req.params;

    const item = await Item.findOne({ _id: itemId, businessId });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.isFavorite = !item.isFavorite;

    if (item.isFavorite) {
      item.favoriteCount += 1;
    }

    await item.save();

    res.json({
      message: "Favorite updated",
      isFavorite: item.isFavorite
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// INCREMENT VIEW COUNT
exports.incrementView = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { itemId } = req.params;

    const item = await Item.findOneAndUpdate(
      { _id: itemId, businessId },
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({
      message: "View counted",
      viewCount: item.viewCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// SEARCH ITEMS + TRACK SEARCH COUNT
exports.searchItems = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({
        message: "Search keyword is required"
      });
    }

    const query = {
      businessId,
      $or: [
        { itemName: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barCode: { $regex: search, $options: "i" } }
      ]
    };

    // Get matching items
    const items = await Item.find(query);

    // Increment search count
    await Item.updateMany(query, {
      $inc: { searchCount: 1 }
    });

    res.json({
      count: items.length,
      items
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};