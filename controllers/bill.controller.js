const Bill = require("../models/Bill");
const Item = require("../models/Item");
const Customer = require("../models/Customer");

// CREATE BILL
exports.createBill = async (req, res) => {
  try {
    const { businessId } = req.user;

    const { customerId, items, discount = 0, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items required" });
    }

    // Check customer
    const customer = await Customer.findOne({ _id: customerId, businessId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    let subTotal = 0;
    let gstTotal = 0;
    let billItems = [];

    // Loop items
    for (let i of items) {
      const dbItem = await Item.findOne({
        _id: i.itemId,
        businessId
      });

      if (!dbItem) {
        return res.status(404).json({ message: "Item not found" });
      }

      const price = dbItem.mrp;
      const total = price * i.quantity;
      const gstAmount = (total * (dbItem.gst || 0)) / 100;

      subTotal += total;
      gstTotal += gstAmount;

      // STOCK ONLY FOR PRODUCT
      if (dbItem.type === "product") {
        if (dbItem.openingStock < i.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${dbItem.itemName}`
          });
        }

        dbItem.openingStock -= i.quantity;
        await dbItem.save();
      }

      billItems.push({
        itemId: dbItem._id,
        itemName: dbItem.itemName,
        type: dbItem.type,
        quantity: i.quantity,
        price,
        gst: dbItem.gst,
        total
      });
    }

    const grandTotal = subTotal + gstTotal - discount;

    const bill = await Bill.create({
      businessId,
      customerId,
      customerName: customer.fullName,
      items: billItems,
      subTotal,
      gstTotal,
      discount,
      grandTotal,
      paymentMethod
    });

    res.status(201).json({
      message: "Bill created successfully",
      bill
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL BILLS
exports.getBills = async (req, res) => {
  try {
    const { businessId } = req.user;

    const bills = await Bill.find({ businessId })
      .sort({ createdAt: -1 });

    res.json(bills);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE BILL
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId } = req.user;

    const bill = await Bill.findOne({
      _id: id,
      businessId
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET BILLS BY CUSTOMER ID
exports.getBillsByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { businessId } = req.user;

    const bills = await Bill.find({
      customerId,
      businessId
    }).sort({ createdAt: -1 });

    if (!bills || bills.length === 0) {
      return res.status(404).json({
        message: "No bills found for this customer"
      });
    }

    res.json({
      count: bills.length,
      bills
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};