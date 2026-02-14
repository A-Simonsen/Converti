const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const sharp = require("sharp");
const path = require("path");

let mainWindow; // Declare mainWindow

function main() {
  app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
      width: 600,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });
    mainWindow.loadFile("index.html");
  });

  // Handler for picking output location
  ipcMain.handle("pickOutputLocation", async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Choose Output Folder",
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0]; // Return the selected folder path
      }
      return null; // User canceled
    } catch (error) {
      console.error("Error picking output location:", error);
      return null; // Return null on error
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

      console.log("Full result object:", result);
      console.log("Type of result:", typeof result);

      if (!result.canceled && result.filePaths.length > 0) {
        const totalFiles = result.filePaths.length; // Get total number of files for progress tracking

        for (let i = 0; i < result.filePaths.length; i++) {
          const inputPath = result.filePaths[i];

          console.log("Selected file:", inputPath);

          // Build output path
          const oldExt = path.extname(inputPath);
          const fileName = path.basename(inputPath, oldExt); // Get filename without extension
          const newFileName = fileName + selectedExtension; // Add new extension

          let outputPath;
          if (outputFolder) {
            // Use custom output folder
            outputPath = path.join(outputFolder, newFileName);
          } else {
            // Use same folder as input file
            outputPath = inputPath.replace(oldExt, selectedExtension);
          }

          console.log("Output file:", outputPath);

          const extWithoutDot = selectedExtension.substring(1);

          await sharp(inputPath).toFormat(extWithoutDot).toFile(outputPath);

          const progress = Math.round(((i + 1) / totalFiles) * 100);
          mainWindow.webContents.send("conversionProgress", progress); // Send progress update to renderer
        }
      }
    } catch (error) {
      console.error("Error picking file:", error);
    }
  });
}
main();
