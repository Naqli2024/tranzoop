const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  keyFilename: process.env.GCP_KEY_FILE,
});

const bucketName = process.env.GCP_BUCKET_NAME;

exports.uploadFile = async (file, businessId, erpKey) => {
  try {
    const bucket = storage.bucket(bucketName);

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

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  } catch (err) {
    throw err;
  }
};
