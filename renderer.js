// State
let plugins = [];
let activePluginId = null;
let selectedOutputFolder = null;
let previewRequestToken = 0;

// DOM refs
const toolList = document.getElementById("tool-list");
const emptyState = document.getElementById("empty-state");
const toolView = document.getElementById("tool-view");
const toolName = document.getElementById("tool-name");
const toolDescription = document.getElementById("tool-description");
const toolOptions = document.getElementById("tool-options");
const previewSection = document.getElementById("preview-section");
const previewText = document.getElementById("preview-text");
const copyPreviewBtn = document.getElementById("copy-preview-btn");
const outputSection = document.querySelector(".output-section");
const pickOutputBtn = document.getElementById("pick-output-btn");
const outputFolderInfo = document.getElementById("output-folder-info");
const outputFolderPath = document.getElementById("output-folder-path");
const clearOutputBtn = document.getElementById("clear-output-btn");
const convertBtn = document.getElementById("convert-btn");
const progressArea = document.getElementById("progress-area");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const statusMessage = document.getElementById("status-message");

function getActivePlugin() {
  return plugins.find((plugin) => plugin.id === activePluginId) || null;
}

function renderSidebar() {
  toolList.innerHTML = "";

  plugins.forEach((plugin) => {
    const btn = document.createElement("button");
    btn.className = "tool-icon-btn";
    btn.title = plugin.name;
    btn.textContent = plugin.icon || "Tool";
    btn.dataset.pluginId = plugin.id;

    btn.addEventListener("click", () => selectTool(plugin.id));
    toolList.appendChild(btn);
  });
}

function updateOutputSection(plugin) {
  outputSection.classList.toggle("hidden", plugin?.mode === "preview");
}

function updatePreviewSection(plugin) {
  const usesPreview = plugin?.mode === "preview";
  previewSection.classList.toggle("hidden", !usesPreview);
  convertBtn.classList.toggle("hidden", usesPreview);

  if (!usesPreview) {
    previewText.value = "";
  }
}

async function refreshPreview() {
  const plugin = getActivePlugin();
  if (!plugin || plugin.mode !== "preview") {
    return;
  }

  const requestToken = ++previewRequestToken;

  try {
    const result = await window.api.preview(plugin.id, collectOptions());
    if (requestToken !== previewRequestToken) {
      return;
    }

    previewText.value = result?.text || "";
    hideStatus();
  } catch (error) {
    if (requestToken !== previewRequestToken) {
      return;
    }

    previewText.value = "";
    showStatus(error.message, "error");
  }
}

function bindOptionInput(input) {
  input.addEventListener("input", () => {
    if (getActivePlugin()?.mode === "preview") {
      refreshPreview();
    }
  });

  input.addEventListener("change", () => {
    if (getActivePlugin()?.mode === "preview") {
      refreshPreview();
    }
  });
}

function selectTool(pluginId) {
  activePluginId = pluginId;
  const plugin = getActivePlugin();
  if (!plugin) return;

  document.querySelectorAll(".tool-icon-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.pluginId === pluginId);
  });

  emptyState.classList.add("hidden");
  toolView.classList.remove("hidden");

  toolName.textContent = plugin.name;
  toolDescription.textContent = plugin.description;
  renderOptions(plugin.options || []);
  updateOutputSection(plugin);
  updatePreviewSection(plugin);
  convertBtn.textContent = plugin.actionLabel || "Convert";
  hideStatus();
  hideProgress();

  if (plugin.mode === "preview") {
    refreshPreview();
  }
}

function renderOptions(options) {
  toolOptions.innerHTML = "";

  options.forEach((opt) => {
    const group = document.createElement("div");
    group.className = "option-group";

    const label = document.createElement("label");
    label.textContent = opt.label;
    label.setAttribute("for", `opt-${opt.id}`);
    group.appendChild(label);

    if (opt.type === "select") {
      const wrap = document.createElement("div");
      wrap.className = "select-wrap";

      const select = document.createElement("select");
      select.id = `opt-${opt.id}`;
      select.dataset.optionId = opt.id;

      (opt.choices || []).forEach((choice) => {
        const option = document.createElement("option");
        option.value = choice.value;
        option.textContent = choice.label;
        if (choice.value === opt.default) option.selected = true;
        select.appendChild(option);
      });

      select.disabled = (opt.choices || []).length === 0;
      bindOptionInput(select);
      wrap.appendChild(select);
      group.appendChild(wrap);
    } else if (opt.type === "number" || opt.type === "text") {
      const input = document.createElement("input");
      input.id = `opt-${opt.id}`;
      input.dataset.optionId = opt.id;
      input.type = opt.type;
      input.className = "option-input";

      if (opt.default !== undefined) {
        input.value = String(opt.default);
      }

      if (opt.min !== undefined) {
        input.min = String(opt.min);
      }

      if (opt.max !== undefined) {
        input.max = String(opt.max);
      }

      if (opt.step !== undefined) {
        input.step = String(opt.step);
      }

      if (opt.placeholder) {
        input.placeholder = opt.placeholder;
      }

      bindOptionInput(input);
      group.appendChild(input);
    }

    toolOptions.appendChild(group);
  });
}

function collectOptions() {
  const options = {};
  toolOptions.querySelectorAll("[data-option-id]").forEach((el) => {
    options[el.dataset.optionId] = el.value;
  });
  return options;
}

pickOutputBtn.addEventListener("click", async () => {
  const folder = await window.api.pickOutputLocation();
  if (folder) {
    selectedOutputFolder = folder;
    updateFolderDisplay();
  }
});

clearOutputBtn.addEventListener("click", () => {
  selectedOutputFolder = null;
  updateFolderDisplay();
});

copyPreviewBtn.addEventListener("click", () => {
  if (!previewText.value) {
    showStatus("Nothing to copy", "error");
    return;
  }

  window.api.copyText(previewText.value);
  showStatus("Preview copied", "success");
  setTimeout(hideStatus, 2000);
});

function updateFolderDisplay() {
  if (selectedOutputFolder) {
    outputFolderPath.textContent = selectedOutputFolder;
    outputFolderInfo.classList.remove("hidden");
  } else {
    outputFolderInfo.classList.add("hidden");
  }
}

window.api.onConversionProgress((progress) => {
  progressFill.style.width = `${progress}%`;
  progressText.textContent = `${progress}%`;
});

window.api.onConversionError((info) => {
  console.error(`Error: ${info.file} - ${info.error}`);
});

function showProgress() {
  progressArea.classList.remove("hidden");
  progressFill.style.width = "0%";
  progressText.textContent = "0%";
}

function hideProgress() {
  progressArea.classList.add("hidden");
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function hideStatus() {
  statusMessage.className = "status-message hidden";
  statusMessage.textContent = "";
}

convertBtn.addEventListener("click", async () => {
  if (!activePluginId) return;

  hideStatus();
  showProgress();
  convertBtn.disabled = true;

  try {
    const result = await window.api.convert(
      activePluginId,
      collectOptions(),
      selectedOutputFolder,
    );

    if (!result) {
      hideProgress();
      return;
    }

    setTimeout(() => {
      hideProgress();

      if (result.error) {
        const firstFailure = result.failedFiles?.[0];
        const details = firstFailure
          ? ` First failure: ${firstFailure.file} (${firstFailure.error})`
          : "";
        showStatus(`${result.error}${details}`, "error");
      } else if (result.failedFiles.length > 0) {
        showStatus(
          `${result.successCount}/${result.totalFiles} converted - ${result.failedFiles.length} failed. First failure: ${result.failedFiles[0].file} (${result.failedFiles[0].error})`,
          "error",
        );
      } else {
        showStatus(
          `${result.successCount} file${result.successCount !== 1 ? "s" : ""} converted`,
          "success",
        );
        setTimeout(hideStatus, 4000);
      }
    }, 500);
  } catch (error) {
    hideProgress();
    showStatus(`Conversion failed: ${error.message}`, "error");
  } finally {
    convertBtn.disabled = false;
  }
});

async function init() {
  plugins = await window.api.getPlugins();
  renderSidebar();

  if (plugins.length === 1) {
    selectTool(plugins[0].id);
  }
}

init();
