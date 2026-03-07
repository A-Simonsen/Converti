const fs = require("fs");
const path = require("path");

const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "ut",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "ut",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "dolor",
  "in",
  "reprehenderit",
  "in",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "dolore",
  "eu",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "in",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum"
];

function toSentence(words) {
  const [first, ...rest] = words;
  return `${first.charAt(0).toUpperCase()}${first.slice(1)} ${rest.join(" ")}.`;
}

function createParagraph(sentenceCount, offset) {
  const sentences = [];
  let cursor = offset;

  for (let i = 0; i < sentenceCount; i++) {
    const sentenceLength = 8 + ((cursor + i) % 9);
    const sentenceWords = [];

    for (let j = 0; j < sentenceLength; j++) {
      sentenceWords.push(WORDS[(cursor + j) % WORDS.length]);
    }

    sentences.push(toSentence(sentenceWords));
    cursor += sentenceLength;
  }

  return sentences.join(" ");
}

function createLoremIpsum(paragraphCount) {
  const paragraphs = [];
  let offset = 0;

  for (let i = 0; i < paragraphCount; i++) {
    const sentenceCount = 4 + (i % 3);
    paragraphs.push(createParagraph(sentenceCount, offset));
    offset += 17 + i * 3;
  }

  return paragraphs.join("\n\n");
}

async function generate(outputPath, options = {}) {
  if (!outputPath) {
    throw new Error("No output file was provided");
  }

  const paragraphCount = Number.parseInt(options.paragraphs, 10);
  if (!Number.isInteger(paragraphCount) || paragraphCount < 1 || paragraphCount > 20) {
    throw new Error("Paragraph count must be an integer between 1 and 20");
  }

  const resolvedOutputPath = path.resolve(outputPath);
  await fs.promises.mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await fs.promises.writeFile(
    resolvedOutputPath,
    `${createLoremIpsum(paragraphCount)}\n`,
    "utf8",
  );

  return {
    outputPath: resolvedOutputPath,
    paragraphs: paragraphCount,
  };
}

module.exports = { generate };
