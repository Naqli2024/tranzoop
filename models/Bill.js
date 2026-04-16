const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    itemName: String,
    type: String, // product / service
    quantity: Number,
    price: Number,
    gst: Number,
    total: Number,
  },
  { _id: false },
);

const billSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    billNo: {
      type: String,
      unique: true,
    },

    customerName: String,

    items: [billItemSchema],

    subTotal: Number,
    gstTotal: Number,
    discount: {
      type: Number,
      default: 0,
    },
    grandTotal: Number,

    paymentMethods: [
      {
        type: String,
        enum: ["cash", "upi", "card", "credit"],
      },
    ],

    paymentStatus: {
      type: String,
      enum: ["NOT_PAID", "PARTIAL", "PAID"],
      default: "NOT_PAID",
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Bill", billSchema);
