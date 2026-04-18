const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  mobile: String,
  email: String,
  address: String,

  gstNumber: String

}, { timestamps: true });

module.exports = mongoose.model("Supplier", supplierSchema);