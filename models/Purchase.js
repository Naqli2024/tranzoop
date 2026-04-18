const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema({
  itemName: String,
  category: String,
  size: String,

  quantity: Number,
  rate: Number,
  gst: Number,
  total: Number
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true
  },

  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true
  },

  supplierName: String,

  purchaseNo: {
    type: String,
    unique: true
  },

  supplierInvoiceNo: String,

  purchaseDate: Date,
  dueDate: Date,

  items: [purchaseItemSchema],

  subTotal: Number,
  gstTotal: Number,
  grandTotal: Number,

  paymentStatus: {
    type: String,
    enum: ["PAID", "PARTIAL", "PENDING"],
    default: "PENDING"
  }

}, { timestamps: true });

module.exports = mongoose.model("Purchase", purchaseSchema);