---
name: electron-node
description: Use when working on Electron process boundaries, preload APIs, IPC channels, BrowserWindow setup, async file or dialog operations, or Node.js integration in Converti and similar Electron apps.
---

# Electron And Node Patterns

Use these patterns for Converti's main/preload/renderer split.

## Keep Responsibilities In The Right Process

- Put OS access, dialogs, plugin loading, and conversion orchestration in the main process.
- Put DOM updates, metadata-driven UI rendering, and user interaction handling in the renderer.
- Put the narrow bridge between them in `preload.js`.

Do not call Node APIs directly from the renderer.

## Use The Two IPC Patterns Deliberately

Use `invoke` / `handle` when the renderer needs a return value.

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  getPlugins() {
    return ipcRenderer.invoke("getPlugins");
  },
});

// main.js
ipcMain.handle("getPlugins", () => {
  return plugins.map((p) => p.metadata);
});
```

Use `send` / `on` when the main process pushes updates during work.

```javascript
// main.js
mainWindow.webContents.send("conversionProgress", progress);

// preload.js
onConversionProgress(callback) {
  ipcRenderer.on("conversionProgress", (_event, progress) => {
    callback(progress);
  });
}
```

Match channel names exactly across all layers.

## Follow Converti's Current Channel Set

The current app uses:

- `getPlugins`
- `pickOutputLocation`
- `convert`
- `conversionProgress`
- `conversionError`

When adding a new operation:

1. Register the handler or sender in `main.js`.
2. Expose one wrapper in `preload.js`.
3. Consume that wrapper from `renderer.js`.

Change all three together. Do not leave orphaned channels or direct `ipcRenderer` use in the renderer.

## Keep Preload Narrow And Safe

Expose a small `window.api` surface through `contextBridge.exposeInMainWorld(...)`.

- expose concrete methods, not raw Electron objects
- pass plain data across the bridge
- keep one wrapper per channel or event

Prefer this pattern:

```javascript
convert(pluginId, options, outputFolder) {
  return ipcRenderer.invoke("convert", pluginId, options, outputFolder);
}
```

Avoid exposing `ipcRenderer`, `fs`, or other unrestricted Node objects.

## Use Async Control Flow That Matches The Behavior

Converti currently processes selected files sequentially inside the main-process `convert` handler so progress can update per file and failures can be recorded individually.

Use `async/await` for:

- dialog operations
- plugin conversion calls
- file work driven by Node libraries such as `sharp`

If the user wants parallelism, evaluate the impact on progress semantics, error handling, and output ordering before changing the loop.

## Handle Errors At The Boundary

Wrap dialog and conversion logic in `try/catch` inside the main process.

- return `null` for user cancellation when that is the current contract
- return structured error objects for operation failures
- emit `conversionError` for per-file failures when the batch continues

Keep renderer-side status messaging based on the returned result shape instead of trying to inspect thrown errors directly.

## Watch For Common Mistakes

- forgetting to update preload when adding an IPC handler
- using mismatched channel names
- reading plugin modules in the renderer instead of the main process
- returning non-serializable values over IPC
- changing a payload shape in one layer only
- adding a new plugin option type without teaching `renderer.js` how to render and collect it
