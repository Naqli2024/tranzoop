const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true
    },

    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      index: true
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
      default: "PARTIAL"
    },

    note: String,
  },
  { timestamps: true },
);

// FAST LOOKUPS
paymentSchema.index({ businessId: 1, billId: 1 });
paymentSchema.index({ customerId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
