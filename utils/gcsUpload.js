const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  keyFilename: process.env.GCP_KEY_FILE,
});

const bucketName = process.env.GCP_BUCKET_NAME;

const getBucket = () => {
  if (!bucketName) {
    throw new Error("GCP_BUCKET_NAME missing");
  }
  return storage.bucket(bucketName);
};

exports.uploadFile = async (file, businessId, erpKey) => {
  const bucket = getBucket();

  const fileName = `${erpKey}/${businessId}/${Date.now()}_${file.originalname}`;
  const blob = bucket.file(fileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: file.mimetype,
  });

  return new Promise((resolve, reject) => {
    blobStream.on("error", reject);

    blobStream.on("finish", async () => {
      await blob.makePublic();
      resolve(`https://storage.googleapis.com/${bucketName}/${fileName}`);
    });

    blobStream.end(file.buffer);
  });
};

exports.deleteFile = async (fileUrl) => {
  try {
    const bucket = getBucket();

    const filePath = fileUrl.split(".com/")[1];
    if (filePath) {
      await bucket.file(filePath).delete();
    }
  } catch (err) {
    console.log("Delete failed:", err.message);
  }
};
