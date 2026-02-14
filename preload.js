const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getGreeting() {
    return "Hello from preload!";
  },

  pickFile(selectedExtension) {
    return ipcRenderer.invoke("pickFile", selectedExtension);
  },
});
