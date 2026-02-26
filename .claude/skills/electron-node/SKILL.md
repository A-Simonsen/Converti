---
name: electron-node
description: >
  General Electron and Node.js development patterns. Use when working on
  Electron IPC, main/renderer process code, preload scripts, async patterns,
  error handling, or security considerations.
---

# Electron + Node.js Development Patterns

## Process Model

- **Main process** (one): full Node.js + OS access. Creates windows, handles native dialogs, file system operations, application lifecycle.
- **Renderer process** (one per window): runs web content (HTML/CSS/JS), sandboxed, no direct Node.js access.
- All communication between processes goes through IPC via a preload script.

## IPC Communication

### Request-Response (`invoke` / `handle`)

Use when the renderer needs a result back from the main process.

```javascript
// preload.js — expose through contextBridge
contextBridge.exposeInMainWorld("api", {
  pickFile(selectedExtension, outputFolder) {
    return ipcRenderer.invoke("pickFile", selectedExtension, outputFolder);
  },
});

// main.js — register handler
ipcMain.handle("pickFile", async (event, selectedExtension, outputFolder) => {
  const result = await dialog.showOpenDialog({ /* ... */ });
  // ... process and return result
});

// renderer.js — call through window.api
const result = await window.api.pickFile(extension, folder);
```

### Push Events (`send` / `on`)

Use when the main process needs to push data to the renderer (progress, status).

```javascript
// main.js — push to renderer
mainWindow.webContents.send("conversionProgress", progress);

// preload.js — wrap the listener
onConversionProgress(callback) {
  ipcRenderer.on("conversionProgress", (event, progress) => {
    callback(progress);
  });
},

// renderer.js — register callback
window.api.onConversionProgress((progress) => {
  progressText.textContent = `${progress}% complete`;
});
```

## Preload Security Model

- Use `contextBridge.exposeInMainWorld("api", { ... })` to create a safe API on `window`.
- **Never** expose `ipcRenderer` directly to the renderer.
- Each method in the exposed object maps to exactly one IPC channel.
- The preload script has access to `require` and Electron APIs but is isolated from the renderer's global scope.
- Renderer code only sees `window.api.*` — no `require`, no `ipcRenderer`, no Node.js globals.

## Async Patterns

- Use `async/await` for all async operations (file I/O, sharp, dialogs).
- Electron dialog APIs return Promises — always `await` them.
- **Sequential batch** (when you need progress tracking): `for` loop with `await` inside.
- **Parallel batch** (when order doesn't matter): `Promise.all()` with array of promises.

## Error Handling

- Wrap file system and external library calls in `try/catch`.
- In IPC handlers, catch errors and return a sensible default (e.g., `null`) rather than letting them propagate as unhandled rejections.
- Log errors with `console.error` — visible in terminal (main process) or DevTools (renderer).
- Consider per-item error handling in batch operations: skip failed items vs. abort entire batch.

## Adding New IPC Channels

Checklist for adding a new operation:

1. **main.js**: Add `ipcMain.handle("channelName", async (event, ...args) => { ... })`
2. **preload.js**: Add a wrapper method inside `contextBridge.exposeInMainWorld`:
   ```javascript
   newMethod(...args) {
     return ipcRenderer.invoke("channelName", ...args);
   }
   ```
3. **renderer.js**: Call `window.api.newMethod(...args)`
4. For main→renderer push events: use `webContents.send` in main and add an `ipcRenderer.on` wrapper in preload.

## Common Pitfalls

- **Forgetting `await`** on dialog calls — returns a Promise object instead of the result
- **Using `require` in renderer** — fails with `contextIsolation` enabled; all Node.js access must go through preload
- **Missing `mainWindow` reference** — IPC handlers need access to `webContents.send`; store the window at module scope
- **IPC channel name mismatches** — `handle("pickFile")` must match `invoke("pickFile")` exactly
- **Not checking `canceled`** — `dialog.showOpenDialog` returns `{ canceled, filePaths }`; always check `canceled` before using `filePaths`
- **Listener accumulation** — `ipcRenderer.on` adds a new listener each call; if the setup function is called multiple times, listeners stack up
