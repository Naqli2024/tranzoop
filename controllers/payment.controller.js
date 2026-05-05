const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Bill = require("../models/Bill");

// ADD PAYMENT
exports.addPayment = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { billId, payments } = req.body;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: "Payments array required" });
    }

    const bill = await Bill.findOne({ _id: billId, businessId });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const currentDue = bill.dueAmount;

    if (currentDue <= 0) {
      return res.status(400).json({ message: "Already paid" });
    }

    const totalIncoming = payments.reduce((sum, p) => {
      if (!p.amount || p.amount <= 0) {
        throw new Error("Invalid amount");
      }
      return sum + p.amount;
    }, 0);

    if (totalIncoming > currentDue) {
      return res.status(400).json({ message: "Exceeds due" });
    }

    const newPaidAmount = Number((bill.paidAmount + totalIncoming).toFixed(2));
    const newDueAmount = Number((bill.grandTotal - newPaidAmount).toFixed(2));

    let status = "PARTIAL";
    if (newDueAmount === 0) status = "PAID";

    // Save payments
    const paymentDocs = payments.map(p => ({
      businessId,
      billId,
      customerId: bill.customerId,
      amount: p.amount,
      method: p.method,
      paymentStatus: status
    }));

    const savedPayments = await Payment.insertMany(paymentDocs);

    // Update bill
    const methods = new Set(bill.paymentMethods || []);
    payments.forEach(p => methods.add(p.method));

    bill.paymentMethods = [...methods];
    bill.paidAmount = newPaidAmount;
    bill.dueAmount = newDueAmount;
    bill.paymentStatus = status;

    await bill.save();

    res.json({
      message: "Payment added",
      payments: savedPayments,
      bill: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status
      }
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPaymentsByBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { businessId } = req.user;

    const bill = await Bill.findById(billId);
    const payments = await Payment.find({
      billId,
      businessId,
    }).sort({ createdAt: -1 });

    res.json({
      billId: bill._id,
      billNo: bill.billNo,
      grandTotal: bill.grandTotal,
      paidAmount: bill.paidAmount,
      dueAmount: bill.dueAmount,
      payments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
