const ERP = require("../models/ERP");
const Business = require("../models/Business");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register Business + User
exports.registerBusiness = async (req, res) => {
  try {
    const { key } = req.params;

    const { shopName, address, mobile, username, password } = req.body;

    // Validate input
    if (!shopName || !mobile || !username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check ERP
    const erp = await ERP.findOne({ key });
    if (!erp) {
      return res.status(404).json({ message: "ERP not found" });
    }

    // Prevent duplicate business (same mobile)
    const existingBusiness = await Business.findOne({ mobile });
    if (existingBusiness) {
      return res.status(400).json({ message: "Business already exists" });
    }

    // Generate OTP
    const otp = generateOtp();

    // Create Business
    const business = await Business.create({
      erpId: erp._id,
      erpKey: key,
      shopName,
      address,
      mobile,
      otp,
      isVerified: false
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create({
      businessId: business._id,
      username,
      password: hashedPassword
    });

    res.status(201).json({
      message: "Business registered successfully",
      business,
      userId: user._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verify OTP 
exports.verifyMobile = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile and OTP required" });
    }

    const business = await Business.findOne({ mobile });

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    if (business.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark verified
    business.isVerified = true;
    business.otp = null; // optional: clear OTP

    await business.save();

    res.json({ message: "Mobile number verified" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Business by ERP Key
exports.getBusinessesByERP = async (req, res) => {
  try {
    const { key } = req.params;

    const businesses = await Business.find({ erpKey: key });

    res.json(businesses);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get Business by ID
exports.getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await Business.findById(id);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json(business);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get All Businesses
exports.getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find().populate("erpId", "name key");

    res.json(businesses);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};