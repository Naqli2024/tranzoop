const Bill = require("../models/Bill");
const Payment = require("../models/Payment");
const Purchase = require("../models/Purchase");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Item = require("../models/Item");

// ==============================
//  1. DASHBOARD SUMMARY
// ==============================
exports.getDashboardSummary = async (req, res) => {
  try {
    const { businessId } = req.user;

    // IST BASED DATE
    const now = new Date();
    const start = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    start.setHours(0, 0, 0, 0);

    const end = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    end.setHours(23, 59, 59, 999);

    const bills = await Bill.find({ businessId });
    const todayBills = await Bill.find({
      businessId,
      createdAt: { $gte: start, $lte: end },
    });

    const payments = await Payment.find({ businessId });
    const purchases = await Purchase.find({ businessId });

    // TOTALS
    const totalRevenue = bills.reduce((s, b) => s + b.subTotal, 0);
    const todaySales = todayBills.reduce((s, b) => s + b.subTotal, 0);
    const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
    const totalOutstanding = bills.reduce(
      (s, b) => s + (b.dueAmount || 0),
      0
    );

    const supplierPayable = purchases.reduce(
      (s, p) => s + (p.grandTotal - (p.paidAmount || 0)),
      0
    );

    // PROFIT CALCULATION
    let totalCost = 0;

    bills.forEach((b) => {
      b.items.forEach((i) => {
        if (i.type === "product") {
          totalCost += (i.cost || 0) * i.quantity;
        }
      });
    });

    const profit = totalRevenue - totalCost;

    res.json({
      todaySales,
      totalRevenue,
      totalReceived,
      totalOutstanding,
      customerReceivable: totalOutstanding,
      supplierPayable,
      profit,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAgingReport = async (req, res) => {
  try {
    const { businessId } = req.user;

    const bills = await Bill.find({ businessId });

    let bucket = {
      "0-30": 0,
      "30-60": 0,
      "60+": 0,
    };

    const now = new Date();

    bills.forEach((b) => {
      const days = (now - new Date(b.createdAt)) / (1000 * 60 * 60 * 24);

      if (b.dueAmount > 0) {
        if (days <= 30) bucket["0-30"] += b.dueAmount;
        else if (days <= 60) bucket["30-60"] += b.dueAmount;
        else bucket["60+"] += b.dueAmount;
      }
    });

    res.json(bucket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomersLedgerSummary = async (req, res) => {
  try {
    const { businessId } = req.user;

    const bills = await Bill.find({ businessId });
    const payments = await Payment.find({ businessId });

    const map = {};

    // Bills
    bills.forEach(b => {
      if (!map[b.customerId]) {
        map[b.customerId] = {
          customerId: b.customerId,
          customerName: b.customerName,
          totalBill: 0,
          totalPaid: 0
        };
      }

      map[b.customerId].totalBill += b.grandTotal;
    });

    // Payments
    payments.forEach(p => {
      const bill = bills.find(b => b._id.toString() === p.billId.toString());
      if (!bill) return;

      if (map[bill.customerId]) {
        map[bill.customerId].totalPaid += p.amount;
      }
    });

    const result = Object.values(map).map(c => ({
      ...c,
      balance: c.totalBill - c.totalPaid
    }));

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getCustomerLedgerById = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { customerId } = req.params;

    const customer = await Customer.findOne({ _id: customerId, businessId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const bills = await Bill.find({ businessId, customerId });
    const payments = await Payment.find({ businessId }).populate("billId");

    // Filter only this customer's payments
    const customerPayments = payments.filter(
      p => p.billId?.customerId.toString() === customerId
    );

    let ledger = [];

    // Bills → Debit
    bills.forEach(b => {
      ledger.push({
        date: b.createdAt,
        type: "BILL",
        ref: b.billNo,
        debit: b.grandTotal,
        credit: 0
      });
    });

    // Payments → Credit
    customerPayments.forEach(p => {
      ledger.push({
        date: p.createdAt,
        type: "PAYMENT",
        ref: p.method,
        debit: 0,
        credit: p.amount
      });
    });

    // Sort by date
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Running balance
    let balance = 0;
    ledger = ledger.map(entry => {
      balance += entry.debit - entry.credit;
      return { ...entry, balance };
    });

    res.json({
      customerId,
      customerName: customer.fullName,
      ledger,
      totalBalance: balance
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getSupplierLedger = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { supplierId } = req.params;

    const purchases = await Purchase.find({ businessId, supplierId });

    let ledger = [];
    let balance = 0;

    purchases.forEach((p) => {
      ledger.push({
        date: p.createdAt,
        type: "PURCHASE",
        ref: p.purchaseNo,
        debit: 0,
        credit: p.grandTotal,
        balance: 0,
      });
    });

    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    ledger = ledger.map((l) => {
      balance += l.credit - l.debit;
      return { ...l, balance };
    });

    res.json({ ledger, balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRevenueSplit = async (req, res) => {
  try {
    const { businessId } = req.user;

    const bills = await Bill.find({ businessId });

    let product = 0;
    let service = 0;

    bills.forEach((b) => {
      b.items.forEach((i) => {
        if (i.type === "product") product += i.total;
        else service += i.total;
      });
    });

    res.json({ product, service });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopServices = async (req, res) => {
  try {
    const { businessId } = req.user;

    const bills = await Bill.find({ businessId });

    let map = {};

    bills.forEach((b) => {
      b.items.forEach((i) => {
        if (i.type === "service") {
          map[i.itemName] = (map[i.itemName] || 0) + i.total;
        }
      });
    });

    const result = Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentSplit = async (req, res) => {
  try {
    const { businessId } = req.user;

    const payments = await Payment.find({ businessId });

    let split = {
      cash: 0,
      upi: 0,
      card: 0,
      credit: 0,
    };

    payments.forEach((p) => {
      if (split[p.method] !== undefined) {
        split[p.method] += p.amount;
      }
    });

    res.json(split);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDailySales = async (req, res) => {
  try {
    const { businessId } = req.user;

    const bills = await Bill.find({ businessId });

    let map = {};

    bills.forEach((b) => {
      const date = new Date(b.createdAt).toLocaleDateString();

      map[date] = (map[date] || 0) + b.grandTotal;
    });

    const result = Object.entries(map).map(([date, total]) => ({
      date,
      total,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


