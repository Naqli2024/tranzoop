const { Storage } = require("@google-cloud/storage");
const path = require("path");

const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE, // JSON file path
});

const bucket = storage.bucket(process.env.GCS_BUCKET);

exports.uploadToGCS = async (file, businessId, erpKey) => {
  const fileName = `${erpKey}/${businessId}/${Date.now()}_${file.originalname}`;

  const blob = bucket.file(fileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
  });

  return new Promise((resolve, reject) => {
    blobStream.on("error", reject);

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};
