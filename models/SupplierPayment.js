const mongoose = require("mongoose");

const supplierPaymentSchema = new mongoose.Schema({
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

  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchase"
  },

  amount: Number,

  method: {
    type: String,
    enum: ["cash", "upi", "card", "bank"]
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("SupplierPayment", supplierPaymentSchema);