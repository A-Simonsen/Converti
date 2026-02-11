const { app, BrowserWindow, ipcMain, dialog } = require("electron");
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

  ipcMain.handle("pick-file", async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif"] }],
    });
    if (result.canceled) {
      return null;
    }
    return result.filePaths[0];
  });
}
main();
