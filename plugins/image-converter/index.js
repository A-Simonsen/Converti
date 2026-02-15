const sharp = require("sharp");
const path = require("path");

// Plugin to convert images using Sharp

async function convert(inputPath, outputPath) {
  const format = path.extname(outputPath).substring(1);

  try {
    await sharp(inputPath).toFormat(format).toFile(outputPath);

    return true;
  } catch (error) {
    console.error("Error converting image:", error);

    return false;
  }
}

module.exports = { convert };
