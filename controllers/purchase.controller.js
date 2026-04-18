const Purchase = require("../models/Purchase");
const Supplier = require("../models/Supplier");
const Item = require("../models/Item");

const generatePurchaseNo = () => {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,"");
  const rand = Math.floor(1000 + Math.random()*9000);
  return `PUR-${date}-${rand}`;
};

exports.createPurchase = async (req, res) => {
  try {
    const { businessId } = req.user;

    const {
      supplierId,
      supplierInvoiceNo,
      purchaseDate,
      dueDate,
      items
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items required" });
    }

    const supplier = await Supplier.findOne({ _id: supplierId, businessId });

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    let subTotal = 0;
    let gstTotal = 0;

    // LOOP ITEMS
    for (let i of items) {

      const total = i.rate * i.quantity;
      const gstAmount = (total * (i.gst || 0)) / 100;

      subTotal += total;
      gstTotal += gstAmount;

      // STOCK IN LOGIC
      let item = await Item.findOne({
        businessId,
        itemName: i.itemName
      });

      if (item) {
        item.openingStock += i.quantity;
        item.cost = i.rate; // update latest cost
        await item.save();
      } else {
        // create new item automatically
        await Item.create({
          businessId,
          itemName: i.itemName,
          category: i.category,
          gst: i.gst,
          mrp: i.rate,
          cost: i.rate,
          openingStock: i.quantity
        });
      }
    }

    const grandTotal = subTotal + gstTotal;

    const purchase = await Purchase.create({
      businessId,
      supplierId,
      supplierName: supplier.name,
      purchaseNo: generatePurchaseNo(),

      supplierInvoiceNo,
      purchaseDate,
      dueDate,

      items,
      subTotal,
      gstTotal,
      grandTotal
    });

    res.status(201).json({
      message: "Purchase created & stock updated",
      purchase
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET ALL PURCHASES
exports.getPurchases = async (req, res) => {
  try {
    const { businessId } = req.user;

    const { search, paymentStatus } = req.query;

    let filter = { businessId };

    // Search by supplier name
    if (search) {
      filter.supplierName = { $regex: search, $options: "i" };
    }

    // Filter by payment status
    if (paymentStatus && paymentStatus !== "All") {
      filter.paymentStatus = paymentStatus;
    }

    const purchases = await Purchase.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      count: purchases.length,
      purchases
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET PURCHASE BY PURCHASE NO
exports.getPurchaseByNo = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { purchaseNo } = req.params;

    const purchase = await Purchase.findOne({
      businessId,
      purchaseNo
    }).populate("supplierId", "name mobile gstNumber");

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found"
      });
    }

    res.json({
      purchase
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET PURCHASE BY SUPPLIER
exports.getPurchasesBySupplier = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { supplierId } = req.params;

    const purchases = await Purchase.find({
      businessId,
      supplierId
    }).sort({ createdAt: -1 });

    res.json(purchases);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};