const sharp = require("sharp");
const path = require("path");

async function convert(inputPath, outputFolder, options) {
  const format = options.format; // e.g. ".jpg"
  const extWithoutDot = format.substring(1);

  // Build output path
  const oldExt = path.extname(inputPath);
  const fileName = path.basename(inputPath, oldExt);
  const newFileName = fileName + format;

  let outputPath;
  if (outputFolder) {
    outputPath = path.join(outputFolder, newFileName);
  } else {
    outputPath = path.join(path.dirname(inputPath), newFileName);
  }

  await sharp(inputPath).toFormat(extWithoutDot).toFile(outputPath);
  return true;
}

module.exports = { convert };
