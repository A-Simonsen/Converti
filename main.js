const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");
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

  ipcMain.handle("getPlugins", () => {
    return plugins.map((p) => p.metadata);
  });

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

    if (!plugin.module || typeof plugin.module.convert !== "function") {
      return {
        totalFiles: 0,
        successCount: 0,
        failedFiles: [],
        error: `Plugin "${pluginId}" cannot convert files`,
      };
    }

    if (outputFolder) {
      try {
        const outputStats = await fs.promises.stat(outputFolder);
        if (!outputStats.isDirectory()) {
          return {
            totalFiles: 0,
            successCount: 0,
            failedFiles: [],
            error: "The selected output location is not a folder",
          };
        }
      } catch (error) {
        return {
          totalFiles: 0,
          successCount: 0,
          failedFiles: [],
          error: `Output folder is not available: ${error.message}`,
        };
      }
    }

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
              file: inputPath,
              error: fileError.message,
            });
            mainWindow.webContents.send("conversionError", {
              file: inputPath,
              error: fileError.message,
            });
          }

          const progress = Math.round(((i + 1) / totalFiles) * 100);
          mainWindow.webContents.send("conversionProgress", progress);
        }

        return {
          totalFiles,
          successCount,
          failedFiles,
          error:
            successCount === 0 && failedFiles.length > 0
              ? "All selected files failed to convert"
              : null,
        };
      }

      return null;
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
