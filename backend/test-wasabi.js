
require("dotenv").config();

const { HeadBucketCommand } = require("@aws-sdk/client-s3");
const wasabi = require("./config/wasabi");

async function testWasabi() {
  try {
    const command = new HeadBucketCommand({
      Bucket: process.env.WASABI_BUCKET,
    });

    await wasabi.send(command);

    console.log("Wasabi connected successfully!");
    console.log("Bucket:", process.env.WASABI_BUCKET);
    console.log("Region:", process.env.WASABI_REGION);
  } catch (error) {
    console.log("Wasabi connection failed!");
    console.log("Error:", error.name);
    console.log("Message:", error.message);
  }
}

testWasabi();
