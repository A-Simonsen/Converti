const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { loadPlugins } = require("./core/plugin-loader");

let mainWindow;
let plugins = [];

function getConverterPlugin() {
  const plugin = plugins.find((p) => p.metadata.category === "image");
  return plugin ? plugin.module : null;
}

function main() {
  app.whenReady().then(() => {
    // Load plugins at startup
    plugins = loadPlugins();

    mainWindow = new BrowserWindow({
      width: 600,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });
    mainWindow.loadFile("index.html");
  });

  // Handler to get available plugins
  ipcMain.handle("getPlugins", () => {
    return plugins.map((p) => p.metadata);
  });

  // Handler for picking output location
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

  ipcMain.handle("pickFile", async (event, selectedExtension, outputFolder) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["multiSelections", "openFile"],
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "gif"] },
        ],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const totalFiles = result.filePaths.length;
        let successCount = 0;
        const failedFiles = [];

        const converter = getConverterPlugin();

        for (let i = 0; i < result.filePaths.length; i++) {
          const inputPath = result.filePaths[i];
          const oldExt = path.extname(inputPath);
          const fileName = path.basename(inputPath, oldExt);
          const newFileName = fileName + selectedExtension;

          let outputPath;
          if (outputFolder) {
            outputPath = path.join(outputFolder, newFileName);
          } else {
            outputPath = inputPath.replace(oldExt, selectedExtension);
          }

          try {
            if (converter) {
              // Use the plugin's convert function
              const success = await converter.convert(inputPath, outputPath);
              if (success) {
                successCount++;
              } else {
                failedFiles.push({
                  file: path.basename(inputPath),
                  error: "Conversion returned false",
                });
                mainWindow.webContents.send("conversionError", {
                  file: path.basename(inputPath),
                  error: "Conversion failed",
                });
              }
            } else {
              // Fallback: no plugin found
              failedFiles.push({
                file: path.basename(inputPath),
                error: "No converter plugin loaded",
              });
              mainWindow.webContents.send("conversionError", {
                file: path.basename(inputPath),
                error: "No converter plugin available",
              });
            }
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
      console.error("Error picking file:", error);
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
