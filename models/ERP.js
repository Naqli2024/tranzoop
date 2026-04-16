const mongoose = require("mongoose");

const erpSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  logo: String,
  key: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: String,

  modules: [String] // ["customer", "item", "stock"]

}, { timestamps: true });

module.exports = mongoose.model("ERP", erpSchema);