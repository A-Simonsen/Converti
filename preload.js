const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getPlugins() {
    return ipcRenderer.invoke("getPlugins");
  },

  pickOutputLocation() {
    return ipcRenderer.invoke("pickOutputLocation");
  },

  convert(pluginId, options, outputFolder) {
    return ipcRenderer.invoke("convert", pluginId, options, outputFolder);
  },

  onConversionProgress(callback) {
    ipcRenderer.on("conversionProgress", (event, progress) => {
      callback(progress);
    });
  },

  onConversionError(callback) {
    ipcRenderer.on("conversionError", (event, errorInfo) => {
      callback(errorInfo);
    });
  },
});
