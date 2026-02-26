const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { loadPlugins } = require("./core/plugin-loader");

let mainWindow;
let plugins = [];

function getPluginById(pluginId) {
  return plugins.find((p) => p.metadata.id === pluginId);
}

function main() {
  app.whenReady().then(() => {
    plugins = loadPlugins();

    mainWindow = new BrowserWindow({
      width: 700,
      height: 500,
      minWidth: 500,
      minHeight: 400,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });
    mainWindow.loadFile("index.html");
  });

  // Get available plugins (metadata only)
  ipcMain.handle("getPlugins", () => {
    return plugins.map((p) => p.metadata);
  });

  // Pick output folder
  ipcMain.handle("pickOutputLocation", async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Choose Output Folder",
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    } catch (error) {
      console.error("Error picking output location:", error);
      return null;
    }
  });

  // Generic convert handler — works with any plugin
  ipcMain.handle("convert", async (event, pluginId, options, outputFolder) => {
    const plugin = getPluginById(pluginId);
    if (!plugin) {
      return {
        totalFiles: 0,
        successCount: 0,
        failedFiles: [],
        error: `Plugin "${pluginId}" not found`,
      };
    }

    // Build file filter from plugin metadata
    const fileFilter = plugin.metadata.fileFilter || {
      name: "All Files",
      extensions: ["*"],
    };

    try {
      const result = await dialog.showOpenDialog({
        properties: ["multiSelections", "openFile"],
        filters: [fileFilter],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const totalFiles = result.filePaths.length;
        let successCount = 0;
        const failedFiles = [];

        for (let i = 0; i < result.filePaths.length; i++) {
          const inputPath = result.filePaths[i];

          try {
            await plugin.module.convert(inputPath, outputFolder, options);
            successCount++;
          } catch (fileError) {
            failedFiles.push({
              file: path.basename(inputPath),
              error: fileError.message,
            });
            mainWindow.webContents.send("conversionError", {
              file: path.basename(inputPath),
              error: fileError.message,
            });
          }

          const progress = Math.round(((i + 1) / totalFiles) * 100);
          mainWindow.webContents.send("conversionProgress", progress);
        }

        return { totalFiles, successCount, failedFiles };
      }

      return null; // User canceled
    } catch (error) {
      console.error("Error in convert handler:", error);
      return {
        totalFiles: 0,
        successCount: 0,
        failedFiles: [],
        error: error.message,
      };
    }
  });
}

main();
