const Bill = require("../models/Bill");
const Item = require("../models/Item");
const Customer = require("../models/Customer");
const WorkOrder = require("../models/WorkOrder");

// Generate Bill No
const generateBillNo = (erpKey = "INV") => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${erpKey.toUpperCase()}-INV-${date}-${random}`;
};

// CREATE BILL
exports.createBill = async (req, res) => {
  try {
    const { businessId, erpKey } = req.user;

    const {
      customerId,
      items,
      workOrderId,
      billingType = "ITEM",
      discount = 0,
      paymentMethod
    } = req.body;

    const customer = await Customer.findOne({ _id: customerId, businessId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    let subTotal = 0;
    let gstTotal = 0;
    let billItems = [];

    // ================================
    // 1. ITEM BILLING (EXISTING)
    // ================================
    if (billingType === "ITEM") {
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Items required" });
      }

      for (let i of items) {
        const dbItem = await Item.findOne({
          _id: i.itemId,
          businessId,
        });

        if (!dbItem) {
          return res.status(404).json({ message: "Item not found" });
        }

        const price = dbItem.mrp;
        const total = price * i.quantity;
        const gstAmount = (total * (dbItem.gst || 0)) / 100;

        subTotal += total;
        gstTotal += gstAmount;

        // STOCK
        if (dbItem.type === "product") {
          if (dbItem.openingStock < i.quantity) {
            return res.status(400).json({
              message: `Insufficient stock for ${dbItem.itemName}`,
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
          sku: i.sku,
          hsn: i.hsn,
          uom: i.uom,
          price,
          gst: dbItem.gst,
          total,
          cost: dbItem.cost || 0
        });
      }
    }

    // ================================
    // 2. WORK ORDER BILLING
    // ================================
    if (billingType === "WORK_ORDER") {
      const wo = await WorkOrder.findOne({
        _id: workOrderId,
        businessId
      });

      if (!wo) {
        return res.status(404).json({ message: "Work order not found" });
      }

      // SERVICES
      for (let s of wo.services || []) {
        const total = s.price;
        const gstAmount = (total * (s.gst || 0)) / 100;

        subTotal += total;
        gstTotal += gstAmount;

        billItems.push({
          itemName: s.name,
          type: "service",
          quantity: 1,
          price: s.price,
          gst: s.gst,
          total,
          cost: 0 
        });
      }

      // OTHER SERVICE
      if (wo.otherService?.price) {
        const total = wo.otherService.price;
        const gstAmount = (total * (wo.otherService.gst || 0)) / 100;

        subTotal += total;
        gstTotal += gstAmount;

        billItems.push({
          itemName: wo.otherService.description,
          type: "service",
          quantity: 1,
          price: wo.otherService.price,
          gst: wo.otherService.gst,
          total,
          cost: 0
        });
      }

      // ADDITIONAL ITEMS
      for (let a of wo.additionalItems || []) {
        const total = a.price * a.qty;

        subTotal += total;

        billItems.push({
          itemName: a.name,
          type: "service",
          quantity: a.qty,
          price: a.price,
          gst: 0,
          total,
          cost: 0
        });
      }

      // TYRES → treat as product (optional)
      for (let t of wo.tyres || []) {
        const total = t.mrp * (t.quantity || 1);

        subTotal += total;

        billItems.push({
          itemName: `${t.brand} ${t.size}`,
          type: "product",
          quantity: t.quantity || 1,
          price: t.mrp,
          gst: 0,
          total,
          cost: 0
        });
      }

      // UPDATE WORK ORDER STATUS
      wo.status = "BILLED";
      await wo.save();
    }

    // ================================
    // FINAL BILL
    // ================================
    const grandTotal = subTotal + gstTotal - discount;

    const bill = await Bill.create({
      businessId,
      billNo: generateBillNo(erpKey),
      customerId,
      customerName: customer.fullName,
      items: billItems,
      subTotal,
      gstTotal,
      discount,
      grandTotal,
      paymentMethods: paymentMethod ? [paymentMethod] : [],
      dueAmount: grandTotal
    });

    // LINK BILL TO WORK ORDER
    if (billingType === "WORK_ORDER") {
      await WorkOrder.findByIdAndUpdate(workOrderId, {
        billId: bill._id,
        status: "BILLED"
      });
    }

    res.status(201).json({
      message: "Bill created successfully",
      bill
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createBillFromWorkOrder = async (req, res) => {
  try {
    const { businessId, erpKey } = req.user;
    const { workOrderId } = req.body;

    const workOrder = await WorkOrder.findOne({
      _id: workOrderId,
      businessId,
    });

    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }

    // Prevent duplicate billing
    if (workOrder.billId) {
      return res.status(400).json({
        message: "Bill already generated for this work order",
      });
    }

    const customer = await Customer.findById(workOrder.customerId);

    let items = [];
    let subTotal = 0;
    let gstTotal = 0;

    // SERVICES
    if (workOrder.services?.length) {
      workOrder.services.forEach((s) => {
        const total = s.price + (s.price * s.gst) / 100;

        items.push({
          itemName: s.name,
          type: "service",
          quantity: 1,
          price: s.price,
          gst: s.gst,
          total,
        });

        subTotal += s.price;
        gstTotal += (s.price * s.gst) / 100;
      });
    }

    // OTHER SERVICE
    if (workOrder.otherService?.price) {
      const s = workOrder.otherService;
      const total = s.price + (s.price * s.gst) / 100;

      items.push({
        itemName: s.description,
        type: "service",
        quantity: 1,
        price: s.price,
        gst: s.gst,
        total,
      });

      subTotal += s.price;
      gstTotal += (s.price * s.gst) / 100;
    }

    // TYRES (TREATED AS PRODUCT)
    if (workOrder.tyres?.length) {
      for (let t of workOrder.tyres) {
        const total = t.mrp * t.quantity;

        items.push({
          itemName: `${t.brand} ${t.size}`,
          type: "product",
          quantity: t.quantity,
          price: t.mrp,
          gst: 0,
          total,
        });

        subTotal += total;

        // OPTIONAL STOCK DEDUCTION (if mapped to item)
        const item = await Item.findOne({
          businessId,
          itemName: new RegExp(t.brand, "i"),
        });

        if (item) {
          item.openingStock -= t.quantity;
          await item.save();
        }
      }
    }

    // ADDITIONAL ITEMS
    if (workOrder.additionalItems?.length) {
      for (let a of workOrder.additionalItems) {
        const total = a.price * a.qty;

        items.push({
          itemName: a.name,
          type: "product",
          quantity: a.qty,
          price: a.price,
          gst: 0,
          total,
        });

        subTotal += total;

        // STOCK DEDUCTION
        const item = await Item.findOne({
          businessId,
          itemName: new RegExp(a.name, "i"),
        });

        if (item) {
          item.openingStock -= a.qty;
          await item.save();
        }
      }
    }

    // FINAL CALCULATION
    const grandTotal = subTotal + gstTotal;

    const bill = await Bill.create({
      businessId,
      billNo: generateBillNo(erpKey),
      customerId: workOrder.customerId,
      customerName: customer?.fullName,

      items,
      subTotal,
      gstTotal,
      grandTotal,

      dueAmount: grandTotal,
    });

    // LINK BILL TO WORK ORDER
    workOrder.billId = bill._id;
    workOrder.status = "BILLED";
    await workOrder.save();

    res.status(201).json({
      message: "Bill created from Work Order",
      bill,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL BILLS
exports.getBills = async (req, res) => {
  try {
    const { businessId } = req.user;

    const bills = await Bill.find({ businessId }).sort({ createdAt: -1 });

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
      businessId,
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
      businessId,
    }).sort({ createdAt: -1 });

    if (!bills || bills.length === 0) {
      return res.status(404).json({
        message: "No bills found for this customer",
      });
    }

    res.json({
      count: bills.length,
      bills,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET BILL BY BILL NO
exports.getBillByBillNo = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { billNo } = req.params;

    const bill = await Bill.findOne({
      billNo,
      businessId
    })
      .populate("customerId", "fullName mobile address")
      .populate("items.itemId", "itemName sku");

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found"
      });
    }

    res.json({
      message: "Bill fetched successfully",
      bill
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};