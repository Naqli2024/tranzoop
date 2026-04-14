const fs = require("fs");
const path = require("path");

exports.uploadFile = async (file, businessId, erpKey) => {
  try {
    // Create folder path
    const folderPath = path.join(
      __dirname,
      "..",
      "uploads",
      erpKey,
      businessId.toString(),
    );

    // Create folders if not exist
    fs.mkdirSync(folderPath, { recursive: true });

    // File name
    const fileName = `${Date.now()}_${file.originalname}`;

    const filePath = path.join(folderPath, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return accessible path (for frontend)
    const publicUrl = `/uploads/${erpKey}/${businessId}/${fileName}`;

    return publicUrl;
  } catch (err) {
    throw err;
  }
};
