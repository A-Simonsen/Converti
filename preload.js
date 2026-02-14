const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getGreeting() {
    return "Hello from preload!";
  },

  pickOutputLocation() {
    return ipcRenderer.invoke("pickOutputLocation");
  },

  pickFile(selectedExtension, outputFolder) {
    return ipcRenderer.invoke("pickFile", selectedExtension, outputFolder);
  },
});
