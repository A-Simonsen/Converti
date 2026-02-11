const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getGreeting() {
    return "Hello from preload!";
  },

  pickFile() {
    return ipcRenderer.invoke("pick-file");
  },
});
