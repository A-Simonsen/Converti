// State
let plugins = [];
let activePluginId = null;
let selectedOutputFolder = null;

// DOM refs
const toolList = document.getElementById("tool-list");
const emptyState = document.getElementById("empty-state");
const toolView = document.getElementById("tool-view");
const toolName = document.getElementById("tool-name");
const toolDescription = document.getElementById("tool-description");
const toolOptions = document.getElementById("tool-options");
const pickOutputBtn = document.getElementById("pick-output-btn");
const outputFolderInfo = document.getElementById("output-folder-info");
const outputFolderPath = document.getElementById("output-folder-path");
const clearOutputBtn = document.getElementById("clear-output-btn");
const convertBtn = document.getElementById("convert-btn");
const progressArea = document.getElementById("progress-area");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const statusMessage = document.getElementById("status-message");

// ===== Sidebar =====

function renderSidebar() {
  toolList.innerHTML = "";

  plugins.forEach((plugin) => {
    const btn = document.createElement("button");
    btn.className = "tool-icon-btn";
    btn.title = plugin.name;
    btn.textContent = plugin.icon || "🔧";
    btn.dataset.pluginId = plugin.id;

    btn.addEventListener("click", () => selectTool(plugin.id));
    toolList.appendChild(btn);
  });
}

function selectTool(pluginId) {
  activePluginId = pluginId;
  const plugin = plugins.find((p) => p.id === pluginId);
  if (!plugin) return;

  // Update sidebar active state
  document.querySelectorAll(".tool-icon-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.pluginId === pluginId);
  });

  // Show tool view, hide empty state
  emptyState.classList.add("hidden");
  toolView.classList.remove("hidden");

  // Populate header
  toolName.textContent = plugin.name;
  toolDescription.textContent = plugin.description;

  // Render options
  renderOptions(plugin.options || []);

  // Reset status
  hideStatus();
  hideProgress();
}

// ===== Dynamic Options =====

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

      opt.choices.forEach((choice) => {
        const option = document.createElement("option");
        option.value = choice.value;
        option.textContent = choice.label;
        if (choice.value === opt.default) option.selected = true;
        select.appendChild(option);
      });

      wrap.appendChild(select);
      group.appendChild(wrap);
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

// ===== Output Folder =====

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

function updateFolderDisplay() {
  if (selectedOutputFolder) {
    outputFolderPath.textContent = selectedOutputFolder;
    outputFolderInfo.classList.remove("hidden");
  } else {
    outputFolderInfo.classList.add("hidden");
  }
}

// ===== Progress =====

window.api.onConversionProgress((progress) => {
  progressFill.style.width = `${progress}%`;
  progressText.textContent = `${progress}%`;
});

window.api.onConversionError((info) => {
  console.error(`Error: ${info.file} — ${info.error}`);
});

function showProgress() {
  progressArea.classList.remove("hidden");
  progressFill.style.width = "0%";
  progressText.textContent = "0%";
}

function hideProgress() {
  progressArea.classList.add("hidden");
}

// ===== Status =====

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function hideStatus() {
  statusMessage.className = "status-message hidden";
}

// ===== Convert =====

convertBtn.addEventListener("click", async () => {
  if (!activePluginId) return;

  hideStatus();
  showProgress();

  const options = collectOptions();
  const result = await window.api.convert(
    activePluginId,
    options,
    selectedOutputFolder,
  );

  if (!result) {
    hideProgress();
    return;
  }

  setTimeout(() => {
    hideProgress();

    if (result.error) {
      showStatus(result.error, "error");
    } else if (result.failedFiles.length > 0) {
      showStatus(
        `${result.successCount}/${result.totalFiles} converted — ${result.failedFiles.length} failed`,
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
});

// ===== Init =====

async function init() {
  plugins = await window.api.getPlugins();
  renderSidebar();

  // Auto-select first plugin if there's only one
  if (plugins.length === 1) {
    selectTool(plugins[0].id);
  }
}

init();
