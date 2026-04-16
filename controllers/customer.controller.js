const Customer = require("../models/Customer");

// Add Customer
exports.addCustomer = async (req, res) => {
  try {
    const { businessId } = req.user;

    const { fullName, mobile } = req.body;

    if (!fullName || !mobile) {
      return res.status(400).json({
        message: "fullName and mobile required",
      });
    }

    // Prevent duplicate mobile
    const existing = await Customer.findOne({ businessId, mobile });

    if (existing) {
      return res.status(400).json({
        message: "Customer already exists",
      });
    }

    const customer = await Customer.create({
      businessId,
      ...req.body,
    });

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Customers
exports.getCustomers = async (req, res) => {
  const { businessId } = req.user;

  const customers = await Customer.find({ businessId });

  res.json(customers);
};

// Get Customer By customer Id
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "No customer found" });
    }
    return res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
