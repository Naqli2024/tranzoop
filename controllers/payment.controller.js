const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Bill = require("../models/Bill");

// ADD PAYMENT
exports.addPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { businessId } = req.user;
    const { billId, amount, method } = req.body;

    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required");
    }

    const bill = await Bill.findOne({ _id: billId, businessId }).session(session);

    if (!bill) {
      throw new Error("Bill not found");
    }

    const currentDue = bill.dueAmount; // always trust DB

    if (currentDue <= 0) {
      throw new Error("Bill already fully paid");
    }

    if (amount > currentDue) {
      throw new Error("Amount exceeds due");
    }

    // safe calculation
    const newPaidAmount = Number((bill.paidAmount + amount).toFixed(2));
    const newDueAmount = Number((bill.grandTotal - newPaidAmount).toFixed(2));

    let status = "NOT_PAID";

    if (newPaidAmount === 0) {
      status = "NOT_PAID";
    } else if (newDueAmount === 0) {
      status = "PAID";
    } else {
      status = "PARTIAL";
    }

    // Save payment
    const payment = await Payment.create(
      [
        {
          businessId,
          billId,
          amount,
          method,
          paymentStatus: status,
        },
      ],
      { session }
    );

    // Update payment methods
    if (!bill.paymentMethods.includes(method)) {
      bill.paymentMethods.push(method);
    }

    // Update bill
    bill.paidAmount = newPaidAmount;
    bill.dueAmount = newDueAmount;
    bill.paymentStatus = status;

    await bill.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Payment recorded successfully",
      payment: payment[0],
      bill: {
        billId: bill._id,
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
