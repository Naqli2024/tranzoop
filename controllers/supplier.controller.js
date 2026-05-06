const mongoose = require("mongoose");
const Supplier = require("../models/Supplier");
const Purchase = require("../models/Purchase");
const SupplierPayment = require("../models/SupplierPayment");

// ADD SUPPLIER
exports.addSupplier = async (req, res) => {
  try {
    const { businessId } = req.user;

    const { name, mobile, email, address, gstNumber } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Supplier name is required"
      });
    }

    // Prevent duplicate supplier (same name + business)
    const existing = await Supplier.findOne({
      businessId,
      name: name.trim()
    });

    if (existing) {
      return res.status(400).json({
        message: "Supplier already exists"
      });
    }

    const supplier = await Supplier.create({
      businessId,
      name,
      mobile,
      email,
      address,
      gstNumber
    });

    res.status(201).json({
      message: "Supplier created",
      supplier
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL SUPPLIERS
exports.getSuppliers = async (req, res) => {
  try {
    const { businessId } = req.user;

    const suppliers = await Supplier.find({ businessId })
      .sort({ createdAt: -1 });

    res.json(suppliers);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// UPDATE SUPPLIER
exports.updateSupplier = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { id } = req.params;

    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, businessId },
      req.body,
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json({
      message: "Supplier updated",
      supplier
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// DELETE SUPPLIER
exports.deleteSupplier = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { id } = req.params;

    const supplier = await Supplier.findOneAndDelete({
      _id: id,
      businessId
    });

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json({
      message: "Supplier deleted"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.addSupplierPayment = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { purchaseId, payments } = req.body;

    // Validate
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: "Payments array required" });
    }

    const purchase = await Purchase.findOne({
      _id: purchaseId,
      businessId
    });

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const currentDue = purchase.dueAmount;

    if (currentDue <= 0) {
      return res.status(400).json({ message: "Already fully paid" });
    }

    // Total incoming
    const totalIncoming = payments.reduce((sum, p) => {
      if (!p.amount || p.amount <= 0) {
        throw new Error("Invalid payment amount");
      }
      return sum + p.amount;
    }, 0);

    if (totalIncoming > currentDue) {
      return res.status(400).json({ message: "Exceeds due amount" });
    }

    // Calculate new totals
    const newPaid = Number((purchase.paidAmount + totalIncoming).toFixed(2));
    const newDue = Number((purchase.grandTotal - newPaid).toFixed(2));

    let status = "PENDING";
    if (newDue === 0) status = "PAID";
    else if (newPaid > 0) status = "PARTIAL";

    // Save multiple payments
    const paymentDocs = payments.map(p => ({
      businessId,
      supplierId: purchase.supplierId,
      purchaseId,
      amount: p.amount,
      method: p.method
    }));

    const savedPayments = await SupplierPayment.insertMany(paymentDocs);

    // Update purchase
    purchase.paidAmount = newPaid;
    purchase.dueAmount = newDue;
    purchase.paymentStatus = status;

    await purchase.save();

    res.json({
      message: "Supplier payments recorded",
      payments: savedPayments,
      purchase: {
        paidAmount: newPaid,
        dueAmount: newDue,
        status
      }
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};