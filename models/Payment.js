const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },

    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
    },

    amount: {
      type: Number,
      required: true,
    },

    method: {
      type: String,
      enum: ["cash", "upi", "card"],
    },

    paymentStatus: {
      type: String,
      enum: ["NOT_PAID", "PARTIAL", "PAID"],
    },

    note: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
