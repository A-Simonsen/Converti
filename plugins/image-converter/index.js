const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const INPUT_FORMAT_IDS = ["jpeg", "png", "webp", "gif", "heif", "tiff", "svg"];
const OUTPUT_OVERRIDES = {
  jpeg: {
    extension: ".jpg",
    label: "JPG",
  },
  png: {
    extension: ".png",
    label: "PNG",
  },
  webp: {
    extension: ".webp",
    label: "WebP",
  },
  gif: {
    extension: ".gif",
    label: "GIF",
  },
  heif: [
    {
      extension: ".avif",
      label: "AVIF",
      encoderOptions: { compression: "av1", quality: 65 },
    },
    {
      extension: ".heif",
      label: "HEIF",
      encoderOptions: { compression: "av1", quality: 65 },
    },
    {
      extension: ".heic",
      label: "HEIC",
      encoderOptions: { compression: "av1", quality: 65 },
    },
  ],
  tiff: {
    extension: ".tiff",
    label: "TIFF",
  },
};

function normalizeExtension(suffix) {
  if (!suffix || !suffix.startsWith(".")) {
    return null;
  }

  const normalized = suffix.slice(1).toLowerCase();
  if (!normalized || normalized.includes(".")) {
    return null;
  }

  return normalized;
}

function getInputExtensions() {
  const extensions = new Set();

  for (const formatId of INPUT_FORMAT_IDS) {
    const format = sharp.format[formatId];
    if (!format?.input?.file) {
      continue;
    }

    for (const suffix of format.input.fileSuffix || []) {
      const extension = normalizeExtension(suffix);
      if (extension) {
        extensions.add(extension);
      }
    }

    for (const alias of format.output?.alias || []) {
      const extension = String(alias).replace(/^\./, "").toLowerCase();
      if (extension && !extension.includes(".")) {
        extensions.add(extension);
      }
    }
  }

  return Array.from(extensions).sort();
}

function getOutputFormats() {
  const formats = [];

  for (const [formatId, override] of Object.entries(OUTPUT_OVERRIDES)) {
    const format = sharp.format[formatId];
    if (!format?.output?.file) {
      continue;
    }

    if (Array.isArray(override)) {
      formats.push(
        ...override.map((item) => ({
          value: item.extension,
          label: item.label,
          sharpFormat: formatId,
          encoderOptions: item.encoderOptions || null,
        })),
      );
      continue;
    }

    formats.push({
      value: override.extension,
      label: override.label,
      sharpFormat: formatId,
      encoderOptions: override.encoderOptions || null,
    });
  }

  return formats.sort((left, right) => left.label.localeCompare(right.label));
}

function getSupportedFormatMap() {
  return new Map(getOutputFormats().map((item) => [item.value.toLowerCase(), item]));
}

function getMetadata(baseMetadata) {
  const outputFormats = getOutputFormats();
  const inputExtensions = getInputExtensions();
  const defaultFormat = outputFormats.find((item) => item.value === ".jpg")?.value
    || outputFormats[0]?.value;

  if (!defaultFormat) {
    throw new Error("No writable image formats are available in the installed sharp build");
  }

  return {
    ...baseMetadata,
    options: (baseMetadata.options || []).map((option) =>
      option.id === "format"
        ? {
            ...option,
            choices: outputFormats.map(({ value, label }) => ({ value, label })),
            default: defaultFormat,
          }
        : option,
    ),
    fileFilter: {
      name: baseMetadata.fileFilter?.name || "Images",
      extensions: inputExtensions,
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

function applyFormat(pipeline, formatInfo, metadata) {
  switch (formatInfo.sharpFormat) {
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
      return pipeline.heif(formatInfo.encoderOptions || { compression: "av1", quality: 65 });
    case "tiff":
      return pipeline.tiff({ quality: 90, compression: "lzw" });
    default:
      return pipeline.toFormat(formatInfo.sharpFormat);
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
    await applyFormat(pipeline, formatInfo, metadata).toFile(outputPath);
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }

  return { outputPath, format: formatInfo.value };
}

module.exports = { convert, getMetadata };
