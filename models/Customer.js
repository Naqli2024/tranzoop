const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true
  },

  fullName: {
    type: String,
    required: true
  },

  companyName: String,

  mobile: {
    type: String,
    required: true
  },

  address: String,

  type: {
    type: String,
    enum: ["B2B", "B2C"],
    default: "B2C"
  }

}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);