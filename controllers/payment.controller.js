const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Bill = require("../models/Bill");

// ADD PAYMENT
exports.addPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { businessId } = req.user;
    const { billId, payments } = req.body;

    // Validate input
    if (!billId) throw new Error("billId is required");

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      throw new Error("Payments array is required");
    }

    // Fetch bill
    const bill = await Bill.findOne({
      _id: billId,
      businessId,
    }).session(session);

    if (!bill) {
      throw new Error("Bill not found");
    }

    const currentDue = bill.dueAmount;

    if (currentDue <= 0) {
      throw new Error("Bill already fully paid");
    }

    // Calculate total incoming
    let totalIncoming = 0;

    for (let p of payments) {
      if (!p.amount || p.amount <= 0) {
        throw new Error("Invalid payment amount");
      }
      totalIncoming += p.amount;
    }

    if (totalIncoming > currentDue) {
      throw new Error("Total payment exceeds due amount");
    }

    // New totals
    const newPaidAmount = Number((bill.paidAmount + totalIncoming).toFixed(2));
    const newDueAmount = Number((bill.grandTotal - newPaidAmount).toFixed(2));

    let status = "NOT_PAID";

    if (newPaidAmount === 0) {
      status = "NOT_PAID";
    } else if (newDueAmount === 0) {
      status = "PAID";
    } else {
      status = "PARTIAL";
    }

    // Save payments ONE BY ONE (SAFE)
    const savedPayments = [];

    for (let p of payments) {
      const payment = await Payment.create(
        [
          {
            businessId,
            billId: bill._id, 
            customerId: bill.customerId,
            amount: p.amount,
            method: p.method,
            paymentStatus: status,
            reference: p.reference || null,
          },
        ],
        { session }
      );

      savedPayments.push(payment[0]);
    }

    // Update payment methods (unique)
    let methods = new Set(bill.paymentMethods || []);

    payments.forEach((p) => {
      methods.add(p.method);
    });

    bill.paymentMethods = Array.from(methods);

    // Update bill
    bill.paidAmount = newPaidAmount;
    bill.dueAmount = newDueAmount;
    bill.paymentStatus = status;

    await bill.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Payment recorded successfully",
      payments: savedPayments,
      bill: {
        billId: bill._id,
        customerName: bill.customerName,
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      error: err.message,
    });
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
