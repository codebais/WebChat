
const { S3Client } = require("@aws-sdk/client-s3");

const wasabi = new S3Client({
  endpoint: process.env.WASABI_ENDPOINT,
  region: process.env.WASABI_REGION,

  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY,
  },

  forcePathStyle: true,
});

module.exports = wasabi;
