const { contextBridge, ipcRenderer, clipboard } = require("electron");

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

  preview(pluginId, options) {
    return ipcRenderer.invoke("preview", pluginId, options);
  },

  copyText(text) {
    clipboard.writeText(text);
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
