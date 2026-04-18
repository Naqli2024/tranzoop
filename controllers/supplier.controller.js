const Supplier = require("../models/Supplier");

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