const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const sharp = require("sharp");
const path = require("path");

function main() {
  app.whenReady().then(() => {
    const window = new BrowserWindow({
      width: 600,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });
    window.loadFile("index.html");
  });

  ipcMain.handle("pickFile", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif"] }],
    });

    console.log("Full result object:", result);
    console.log("Type of result:", typeof result);

    if (!result.canceled && result.filePaths.length > 0) {
      const inputPath = result.filePaths[0];
      console.log("Selected file:", inputPath);

      // Build output path
      const oldExt = path.extname(inputPath);
      const outputPath = inputPath.replace(oldExt, ".jpg");

      console.log("Output file:", outputPath);

      sharp(inputPath).toFormat("jpg").toFile(outputPath);
    }
  });
}
main();
