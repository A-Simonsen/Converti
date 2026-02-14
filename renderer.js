// Store the selected output folder (null if not chosen)
let selectedOutputFolder = null;

// Get reference to progress text element
const progressText = document.getElementById("progress-text");

// Listen for conversion progress updates from main process
window.api.onConversionProgress((progress) => {
  progressText.textContent = `${progress}% complete`;

  // Clear the message after completion
  if (progress === 100) {
    setTimeout(() => {
      progressText.textContent = "";
    }, 2000); // Clear after 2 seconds
  }
});

// Handler for "Pick Output Location" button
const pickOutputBtn = document.getElementById("pick-output-location-btn");
pickOutputBtn.addEventListener("click", async () => {
  selectedOutputFolder = await window.api.pickOutputLocation();
  if (selectedOutputFolder) {
    console.log("Selected output location:", selectedOutputFolder);
  } else {
    console.log("No output location selected");
  }
});

// Handler for "Start Converting" button
const button = document.getElementById("pick-file-btn");
button.addEventListener("click", async () => {
  const extensionSelecter = document.getElementById("extension-selecter");
  const selectedExtension = extensionSelecter.value;

  // Use the stored output folder (or null for same folder as source)
  const filePath = await window.api.pickFile(
    selectedExtension,
    selectedOutputFolder,
  );
  if (filePath) {
    console.log("Selected file:", filePath);
  } else {
    console.log("No file selected");
  }
});
