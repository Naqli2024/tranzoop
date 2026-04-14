const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    erpKey: String,

    itemImage: String, // GCS URL

    itemName: {
      type: String,
      required: true,
    },

    sku: String,
    barCode: String,
    category: String,
    hsn: String,

    gst: Number,
    uom: String,

    mrp: Number,
    cost: Number,
    margin: Number,

    openingStock: {
      type: Number,
      default: 0,
    },

    type: {
      type: String,
      enum: ["product", "service"],
      default: "product",
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    favoriteCount: {
      type: Number,
      default: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    searchCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// UNIQUE PER BUSINESS
itemSchema.index({ businessId: 1, itemName: 1 }, { unique: true });

module.exports = mongoose.model("Item", itemSchema);
