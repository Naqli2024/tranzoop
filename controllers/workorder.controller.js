const WorkOrder = require("../models/WorkOrder");

// WO generator
const generateWO = (erpKey = "TYR") => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${erpKey.toUpperCase()}-${date}-${random}`;
};

exports.createWorkOrder = async (req, res) => {
  try {
    const { businessId, erpKey } = req.user;

    const {
      customerId,
      vehicle,
      advisor,
      complaints,
      services,
      otherService,
      tyres,
      inspection,
      inspectionNotes,
      additionalItems,
    } = req.body;

    if (!customerId || !complaints) {
      return res.status(400).json({
        message: "customerId and complaints are required",
      });
    }

    const workOrderData = {
      businessId, // FROM TOKEN
      woNumber: generateWO(erpKey),
      customerId,
      vehicle,
      advisor,
      complaints,
    };

    // Dynamic fields
    if (services?.length) workOrderData.services = services;
    if (otherService?.description) workOrderData.otherService = otherService;
    if (tyres?.length) workOrderData.tyres = tyres;
    if (inspection) workOrderData.inspection = inspection;
    if (inspectionNotes) workOrderData.inspectionNotes = inspectionNotes;
    if (additionalItems?.length)
      workOrderData.additionalItems = additionalItems;

    const workOrder = await WorkOrder.create(workOrderData);

    res.status(201).json({
      message: "Work Order Created",
      workOrder,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateWorkOrder = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { woNumber } = req.params;

    const workOrder = await WorkOrder.findOneAndUpdate(
      { woNumber, businessId },
      req.body,
      { new: true }
    );

    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }

    res.json({
      message: "Work order updated",
      workOrder
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWorkOrderByNumber = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { woNumber } = req.params;

    const workOrder = await WorkOrder.findOne({
      woNumber,
      businessId
    })
      .populate("customerId", "fullName mobile")
      .populate("billId");

    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }

    res.json(workOrder);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrdersByCustomer = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { customerId } = req.params;

    const orders = await WorkOrder.find({
      businessId,
      customerId
    }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrdersByBusiness = async (req, res) => {
  try {
    const { businessId } = req.user;

    const orders = await WorkOrder.find({ businessId })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteWorkOrder = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { woNumber } = req.params;

    const deleted = await WorkOrder.findOneAndDelete({
      woNumber,
      businessId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Work order not found" });
    }

    res.json({
      message: "Work order deleted"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};