
const sharp = require("sharp");
const path = require("path");

async function compressImage(inputPath, outputPath) {
  try {
    await sharp(inputPath) // yeh original image ko padta h 
      .rotate() //yeh image ki orientation ko correct krta h
      .resize({ //yeh image ko resize krta h
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
        effort: 4,
      })
      .toFile(outputPath);// save krta h compressed file ko

    console.log("Image compressed successfully!");

    return outputPath;
  } catch (error) {
    console.error("Image compression failed:", error.message);
    throw error;
  }
}

module.exports = compressImage;
