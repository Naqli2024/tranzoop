const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    erpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ERP",
      required: true,
    },
    erpKey: {
      type: String,
      required: true,
    },

    shopName: {
      type: String,
      required: true,
    },

    address: String,

    mobile: {
      type: String,
      required: true,
    },
    otp: String,

    isVerified: {
      type: Boolean,
      default: false,
    },
    businessType: {
      type: String,
      required: true,
    },
    gstNo: String,
    companyLogo: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Business", businessSchema);
