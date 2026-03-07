const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const FORMAT_LABELS = {
  jpg: "JPG",
  jpeg: "JPEG",
  png: "PNG",
  webp: "WebP",
  gif: "GIF",
  avif: "AVIF",
  heic: "HEIC",
  heif: "HEIF",
  tif: "TIFF",
  tiff: "TIFF",
  jp2: "JPEG 2000",
  j2k: "JPEG 2000",
  jpx: "JPEG 2000",
};

const FORMAT_ALIASES = {
  jpg: "jpeg",
  jpeg: "jpeg",
  tif: "tiff",
  tiff: "tiff",
  avif: "heif",
  heic: "heif",
  heif: "heif",
  jp2: "jp2k",
  j2k: "jp2k",
  jpx: "jp2k",
};

const FORMAT_CANDIDATES = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
  "heic",
  "heif",
  "tif",
  "tiff",
  "jp2",
  "j2k",
  "jpx",
];

function getSharpFormatId(extension) {
  return FORMAT_ALIASES[extension] || extension;
}

function getSupportedFormats() {
  const formats = [];

  for (const extension of FORMAT_CANDIDATES) {
    const sharpFormatId = getSharpFormatId(extension);
    const sharpFormat = sharp.format[sharpFormatId];
    if (!sharpFormat?.output?.file) {
      continue;
    }

    formats.push({
      value: `.${extension}`,
      label: FORMAT_LABELS[extension] || extension.toUpperCase(),
      sharpFormat: sharpFormatId,
    });
  }

  return formats;
}

function getSupportedFormatMap() {
  return new Map(
    getSupportedFormats().map((item) => [item.value.toLowerCase(), item]),
  );
}

function getMetadata(baseMetadata) {
  const formats = getSupportedFormats();
  const defaultFormat = formats.some((item) => item.value === ".jpg")
    ? ".jpg"
    : formats[0]?.value;

  return {
    ...baseMetadata,
    options: (baseMetadata.options || []).map((option) =>
      option.id === "format"
        ? {
            ...option,
            choices: formats.map(({ value, label }) => ({ value, label })),
            default: defaultFormat,
          }
        : option,
    ),
    fileFilter: {
      ...(baseMetadata.fileFilter || { name: "Images", extensions: [] }),
      extensions: Array.from(
        new Set([
          ...(baseMetadata.fileFilter?.extensions || []),
          ...formats.map((item) => item.value.slice(1)),
        ]),
      ),
    },
  };
}

async function ensureReadableFile(inputPath) {
  const stats = await fs.promises.stat(inputPath);
  if (!stats.isFile()) {
    throw new Error("Input path is not a file");
  }
}

async function ensureOutputDirectory(outputFolder) {
  if (!outputFolder) {
    return;
  }

  const stats = await fs.promises.stat(outputFolder);
  if (!stats.isDirectory()) {
    throw new Error("Output path is not a folder");
  }
}

function buildOutputPath(inputPath, outputFolder, extension) {
  const currentExtension = path.extname(inputPath);
  const baseName = path.basename(inputPath, currentExtension);
  const targetDirectory = outputFolder || path.dirname(inputPath);
  return path.join(targetDirectory, `${baseName}${extension}`);
}

function applyFormat(pipeline, sharpFormat, metadata) {
  switch (sharpFormat) {
    case "jpeg":
      return metadata.hasAlpha
        ? pipeline
            .flatten({ background: "#ffffff" })
            .jpeg({ quality: 90, mozjpeg: true })
        : pipeline.jpeg({ quality: 90, mozjpeg: true });
    case "png":
      return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    case "webp":
      return pipeline.webp({ quality: 90, effort: 6 });
    case "gif":
      return pipeline.gif({ effort: 7 });
    case "heif":
      return pipeline.heif({ quality: 65, compression: "av1" });
    case "tiff":
      return pipeline.tiff({ quality: 90, compression: "lzw" });
    case "jp2k":
      return pipeline.jp2({ quality: 90 });
    default:
      return pipeline.toFormat(sharpFormat);
  }
}

async function convert(inputPath, outputFolder, options = {}) {
  if (!inputPath) {
    throw new Error("No input file was provided");
  }

  await ensureReadableFile(inputPath);
  await ensureOutputDirectory(outputFolder);

  const selectedFormat = String(options.format || "").toLowerCase();
  const formatInfo = getSupportedFormatMap().get(selectedFormat);
  if (!formatInfo) {
    throw new Error(`Unsupported output format "${options.format || ""}"`);
  }

  const outputPath = buildOutputPath(inputPath, outputFolder, formatInfo.value);
  if (path.resolve(outputPath) === path.resolve(inputPath)) {
    throw new Error("Output file would overwrite the original file");
  }

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  let metadata;
  try {
    metadata = await sharp(inputPath, { animated: true }).metadata();
  } catch (error) {
    throw new Error(`Unable to read image metadata: ${error.message}`);
  }

  if (!metadata.format) {
    throw new Error("Input file is not a supported image");
  }

  try {
    const pipeline = sharp(inputPath, { animated: true, failOn: "warning" });
    await applyFormat(pipeline, formatInfo.sharpFormat, metadata).toFile(
      outputPath,
    );
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }

  return { outputPath, format: formatInfo.value };
}

module.exports = { convert, getMetadata };
