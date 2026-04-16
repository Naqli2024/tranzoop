const mongoose = require("mongoose");

const tyreSchema = new mongoose.Schema(
  {
    position: {
      type: String,
      enum: ["FL", "FR", "RL", "RR", "SPARE"],
    },
    brand: String,
    size: String,
    quantity: Number,
    serialNo: String,
    oldCondition: String,
    mrp: Number,
  },
  { _id: false },
);

const inspectionSchema = new mongoose.Schema(
  {
    tyreWear: Boolean,
    brakeCondition: Boolean,
    wheelAlignment: Boolean,
    suspension: Boolean,
    airPressure: Boolean,
    brakeFluid: Boolean,
  },
  { _id: false },
);

const workOrderSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },

    woNumber: {
      type: String,
      unique: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },

    vehicle: {
      registrationNo: String,
      brandModel: String,
      vehicleType: String,
    },

    advisor: String,

    // ALWAYS PRESENT
    complaints: {
      type: String,
      required: true,
    },

    // OPTIONAL BLOCKS
    services: [
      {
        name: String,
        price: Number,
        gst: Number,
      },
    ],

    otherService: {
      description: String,
      price: Number,
      gst: Number,
    },

    tyres: [tyreSchema],

    inspection: inspectionSchema,

    inspectionNotes: String,

    additionalItems: [
      {
        name: String,
        price: Number,
        qty: Number,
      },
    ],

    status: {
      type: String,
      enum: ["CREATED", "IN_PROGRESS", "COMPLETED", "BILLED", "DELIVERED"],
      default: "CREATED",
    },

    bay: String,

    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
    },
    woNumber: {
      type: String,
      required: true,
      unique: true,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WorkOrder", workOrderSchema);
