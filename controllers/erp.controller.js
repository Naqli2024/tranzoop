const ERP = require("../models/ERP");

// Create ERP
exports.createERP = async (req, res) => {
  try {
    const { name, logo, key, description, modules } = req.body;

    const existing = await ERP.findOne({ key });
    if (existing) {
      return res.status(400).json({ message: "ERP already exists" });
    }

    const erp = await ERP.create({
      name,
      logo,
      key,
      description,
      modules
    });

    res.status(201).json(erp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all ERP
exports.getAllERP = async (req, res) => {
  const erps = await ERP.find().select("name key description modules");
  res.json(erps);
};

// Get ERP by key
exports.getERPByKey = async (req, res) => {
  const erp = await ERP.findOne({ key: req.params.key });

  if (!erp) {
    return res.status(404).json({ message: "ERP not found" });
  }

  res.json(erp);
};