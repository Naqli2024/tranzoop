const Customer = require("../models/Customer");
const Bill = require("../models/Bill");

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

// Update customer by Id
exports.updateCustomer = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { id } = req.params;

    const { fullName, mobile } = req.body;

    // Check existing customer
    const customer = await Customer.findOne({ _id: id, businessId });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Prevent duplicate mobile (if changed)
    if (mobile && mobile !== customer.mobile) {
      const existing = await Customer.findOne({ businessId, mobile });

      if (existing) {
        return res.status(400).json({
          message: "Mobile already used by another customer",
        });
      }
    }

    // Update fields (only what is sent)
    Object.assign(customer, req.body);

    await customer.save();

    res.json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete customer by Id
exports.disableCustomer = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { id } = req.params;

    const customer = await Customer.findOneAndUpdate(
      { _id: id, businessId },
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json({
      message: "Customer disabled successfully",
      customer,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
