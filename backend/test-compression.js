
const path = require("path");
const fs = require("fs");
const compressImage = require("./utils/compressImage");

async function testCompression() {
  const inputPath = path.join(__dirname, "test-image.jpg");
  const outputPath = path.join(__dirname, "test-image.webp");

  if (!fs.existsSync(inputPath)) {
    console.log("Please put a test image named test-image.jpg in backend.");
    return;
  }

  const originalSize = fs.statSync(inputPath).size;

  await compressImage(inputPath, outputPath);

  const compressedSize = fs.statSync(outputPath).size;

  console.log("Original size:", (originalSize / 1024).toFixed(2), "KB");
  console.log("Compressed size:", (compressedSize / 1024).toFixed(2), "KB");

  console.log(
    "Size reduction:",
    (((originalSize - compressedSize) / originalSize) * 100).toFixed(2),
    "%"
  );
}

testCompression();
