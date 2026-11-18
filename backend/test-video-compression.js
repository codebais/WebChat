
const path = require("path");
const fs = require("fs");
const compressVideo = require("./utils/compressVideo");

async function testCompression() {
  const inputPath = path.join(__dirname, "test-video.mp4");
  const outputPath = path.join(__dirname, "test-video-compressed.mp4");

  if (!fs.existsSync(inputPath)) {
    console.log("Please add test-video.mp4 inside backend.");
    return;
  }

  try {
    const originalSize = fs.statSync(inputPath).size;

    await compressVideo(inputPath, outputPath);

    const compressedSize = fs.statSync(outputPath).size;

    console.log("Original size:", (originalSize / 1024 / 1024).toFixed(2), "MB");
    console.log("Compressed size:", (compressedSize / 1024 / 1024).toFixed(2), "MB");

    console.log(
      "Size reduction:",
      (((originalSize - compressedSize) / originalSize) * 100).toFixed(2),
      "%"
    );
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testCompression();
