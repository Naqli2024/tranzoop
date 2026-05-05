const { Storage } = require("@google-cloud/storage");
const fs = require("fs");

// DEBUG LOGS 
console.log("KEY PATH:", process.env.GCP_KEY_FILE);
console.log("KEY EXISTS:", fs.existsSync(process.env.GCP_KEY_FILE));
console.log("BUCKET NAME:", process.env.GCP_BUCKET_NAME);

const storage = new Storage({
  projectId: "tranzoop",
  credentials: require(process.env.GCP_KEY_FILE),
});

const getBucket = () => {
  const bucketName = process.env.GCP_BUCKET_NAME;

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
      const bucketName = process.env.GCP_BUCKET_NAME;
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
