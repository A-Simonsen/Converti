// State
let selectedOutputFolder = null;

// DOM elements
const progressArea = document.getElementById("progress-area");
const progressBarFill = document.getElementById("progress-bar-fill");
const progressText = document.getElementById("progress-text");
const statusMessage = document.getElementById("status-message");
const outputFolderInfo = document.getElementById("output-folder-info");
const outputFolderPath = document.getElementById("output-folder-path");
const clearOutputBtn = document.getElementById("clear-output-btn");
const pickOutputBtn = document.getElementById("pick-output-location-btn");
const pickFileBtn = document.getElementById("pick-file-btn");
const extensionSelector = document.getElementById("extension-selector");

// --- Utility Functions ---

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message visible ${type}`;
}

function hideStatus() {
  statusMessage.className = "status-message";
}

function showProgress() {
  progressArea.classList.add("visible");
  progressBarFill.style.width = "0%";
  progressText.textContent = "Starting...";
}

function hideProgress() {
  progressArea.classList.remove("visible");
}

function updateProgress(percent) {
  progressBarFill.style.width = `${percent}%`;
  progressText.textContent = `${percent}% complete`;
}

function updateOutputFolderDisplay() {
  if (selectedOutputFolder) {
    outputFolderPath.textContent = selectedOutputFolder;
    outputFolderInfo.classList.add("visible");
  } else {
    outputFolderInfo.classList.remove("visible");
    outputFolderPath.textContent = "";
  }
}

// --- Progress & Error Listeners ---

window.api.onConversionProgress((progress) => {
  updateProgress(progress);
});

window.api.onConversionError((errorInfo) => {
  console.error(`Conversion error for ${errorInfo.file}: ${errorInfo.error}`);
});

// --- Output Folder ---

pickOutputBtn.addEventListener("click", async () => {
  const folder = await window.api.pickOutputLocation();
  if (folder) {
    selectedOutputFolder = folder;
    updateOutputFolderDisplay();
  }
});

clearOutputBtn.addEventListener("click", () => {
  selectedOutputFolder = null;
  updateOutputFolderDisplay();
});

// --- Conversion ---

pickFileBtn.addEventListener("click", async () => {
  hideStatus();
  showProgress();

  const selectedExtension = extensionSelector.value;

  const result = await window.api.pickFile(
    selectedExtension,
    selectedOutputFolder,
  );

  if (!result) {
    // User canceled the file picker
    hideProgress();
    return;
  }

  // Short delay so the user sees 100% before result
  setTimeout(() => {
    hideProgress();

    if (result.error) {
      showStatus(`Error: ${result.error}`, "error");
    } else if (result.failedFiles.length > 0 && result.successCount > 0) {
      showStatus(
        `${result.successCount}/${result.totalFiles} converted — ${result.failedFiles.length} failed`,
        "error",
      );
    } else if (result.failedFiles.length > 0) {
      showStatus(
        `Conversion failed for ${result.failedFiles.length} file(s): ${result.failedFiles.map((f) => f.file).join(", ")}`,
        "error",
      );
    } else {
      showStatus(
        `${result.successCount} file${result.successCount !== 1 ? "s" : ""} converted successfully`,
        "success",
      );
    }

    // Auto-hide success after 5 seconds
    if (result.failedFiles.length === 0 && !result.error) {
      setTimeout(hideStatus, 5000);
    }
  }, 600);
});
