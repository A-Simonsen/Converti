const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

const OUTPUT_FORMATS = [
  {
    value: ".mp4",
    label: "MP4",
    args: [
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
    ],
  },
  {
    value: ".mkv",
    label: "MKV",
    args: ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac"],
  },
  {
    value: ".mov",
    label: "MOV",
    args: ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac"],
  },
  {
    value: ".webm",
    label: "WebM",
    args: ["-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-c:a", "libopus"],
  },
];

const INPUT_EXTENSIONS = ["mp4", "mov", "mkv", "avi", "webm", "m4v", "mpeg", "mpg"];

function getSupportedFormatMap() {
  return new Map(OUTPUT_FORMATS.map((item) => [item.value.toLowerCase(), item]));
}

function getMetadata(baseMetadata) {
  if (!ffmpegPath) {
    throw new Error("FFmpeg binary is not available for this platform");
  }

  return {
    ...baseMetadata,
    options: (baseMetadata.options || []).map((option) =>
      option.id === "format"
        ? {
            ...option,
            choices: OUTPUT_FORMATS.map(({ value, label }) => ({ value, label })),
            default: OUTPUT_FORMATS[0].value,
          }
        : option,
    ),
    fileFilter: {
      name: baseMetadata.fileFilter?.name || "Videos",
      extensions: INPUT_EXTENSIONS,
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

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Unable to start FFmpeg: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const details = stderr.trim().split(/\r?\n/).slice(-4).join(" ");
      reject(new Error(details || `FFmpeg exited with code ${code}`));
    });
  });
}

async function convert(inputPath, outputFolder, options = {}) {
  if (!ffmpegPath) {
    throw new Error("FFmpeg binary is not available");
  }

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

  try {
    await runFfmpeg(["-y", "-i", inputPath, ...formatInfo.args, outputPath]);
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }

  return { outputPath, format: formatInfo.value };
}

module.exports = { convert, getMetadata };
