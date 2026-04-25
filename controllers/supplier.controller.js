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
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { businessId } = req.user;
    const { purchaseId, amount, method } = req.body;

    if (!amount || amount <= 0) {
      throw new Error("Valid amount required");
    }

    const purchase = await Purchase.findOne({
      _id: purchaseId,
      businessId
    }).session(session);

    if (!purchase) throw new Error("Purchase not found");

    const currentDue = purchase.dueAmount;

    if (currentDue <= 0) {
      throw new Error("Already fully paid");
    }

    if (amount > currentDue) {
      throw new Error("Amount exceeds due");
    }

    const newPaid = purchase.paidAmount + amount;
    const newDue = purchase.grandTotal - newPaid;

    let status = "PENDING";

    if (newDue === 0) status = "PAID";
    else if (newPaid > 0) status = "PARTIAL";

    const payment = await SupplierPayment.create([{
      businessId,
      supplierId: purchase.supplierId,
      purchaseId,
      amount,
      method
    }], { session });

    purchase.paidAmount = newPaid;
    purchase.dueAmount = newDue;
    purchase.paymentStatus = status;

    await purchase.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Supplier payment recorded",
      payment: payment[0],
      purchase: {
        paidAmount: newPaid,
        dueAmount: newDue,
        status
      }
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ error: err.message });
  }
};