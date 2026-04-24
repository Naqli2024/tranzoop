const Payment = require("../models/Payment");
const Bill = require("../models/Bill");

// ADD PAYMENT
exports.addPayment = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { billId, amount, method } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Valid amount is required",
      });
    }

    const bill = await Bill.findOne({ _id: billId, businessId });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // if dueAmount not set
    const currentDue =
      bill.dueAmount && bill.dueAmount > 0
        ? bill.dueAmount
        : bill.grandTotal - bill.paidAmount;

    // Already paid
    if (currentDue <= 0) {
      return res.status(400).json({
        message: "Bill already fully paid",
      });
    }

    // Prevent overpayment
    if (amount > currentDue) {
      return res.status(400).json({
        message: "Amount exceeds due",
      });
    }

    // Calculate updated values
    const newPaidAmount = bill.paidAmount + amount;
    const newDueAmount = bill.grandTotal - newPaidAmount;

    // Determine status
    let status;

    if (newPaidAmount === 0) {
      status = "NOT_PAID";
    } else if (newDueAmount === 0) {
      status = "PAID";
    } else {
      status = "PARTIAL";
    }

    // Save Payment (history)
    const payment = await Payment.create({
      businessId,
      billId,
      amount,
      method,
      paymentStatus: status,
    });

    // Maintain payment methods array
    let methods = bill.paymentMethods || [];

    if (!methods.includes(method)) {
      methods.push(method);
    }

    bill.paymentMethods = methods;

    // Update financials
    bill.paidAmount = newPaidAmount;
    bill.dueAmount = newDueAmount;
    bill.paymentStatus = status;

    await bill.save();

    res.json({
      message: "Payment recorded",
      payment,
      billStatus: status,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
