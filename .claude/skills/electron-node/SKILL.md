---
name: electron-node
version: 0.1.0
description: >
  This skill should be used when the user asks to "add an IPC handler",
  "create an IPC channel", "expose a new API to the renderer", "add a preload
  method", "fix IPC communication", "handle async operations in Electron",
  "add error handling to main process", "create a new BrowserWindow", or
  mentions Electron security, context isolation, or preload scripts.
---

# Electron + Node.js Development Patterns

## Process Model

Electron runs two process types:

- **Main process** (one instance) — full Node.js + OS access. Creates windows, handles native dialogs, file system operations, and application lifecycle.
- **Renderer process** (one per window) — runs web content (HTML/CSS/JS), sandboxed with no direct Node.js access.

All communication between processes goes through IPC via a preload script.

## IPC Communication

### Request-Response Pattern (`invoke` / `handle`)

Apply when the renderer needs a result back from the main process.

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

### Push Events Pattern (`send` / `on`)

Apply when the main process needs to push data to the renderer (progress, status notifications).

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

The preload script bridges main and renderer while maintaining security:

- Expose a controlled API via `contextBridge.exposeInMainWorld("api", { ... })`.
- **Never** expose `ipcRenderer` directly to the renderer.
- Map each method in the exposed object to exactly one IPC channel.
- The preload script has access to `require` and Electron APIs but remains isolated from the renderer's global scope.
- Renderer code only sees `window.api.*` — no `require`, no `ipcRenderer`, no Node.js globals.

## Async Patterns

- Apply `async/await` for all asynchronous operations (file I/O, sharp, dialogs).
- Electron dialog APIs return Promises — always `await` them.
- **Sequential batch processing** (when progress tracking is needed): iterate with a `for` loop containing `await` inside.
- **Parallel batch processing** (when order does not matter): collect promises and resolve with `Promise.all()`.

## Error Handling

- Wrap file system and external library calls in `try/catch`.
- In IPC handlers, catch errors and return a sensible default (e.g., `null`) rather than letting them propagate as unhandled rejections.
- Log errors with `console.error` — visible in terminal (main process) or DevTools (renderer).
- For batch operations, decide between per-item error handling (skip failed items) or aborting the entire batch.

## Adding New IPC Channels

Checklist for adding a new IPC operation:

1. **main.js** — Register the handler:
   ```javascript
   ipcMain.handle("channelName", async (event, ...args) => { ... })
   ```
2. **preload.js** — Add a wrapper method inside `contextBridge.exposeInMainWorld`:
   ```javascript
   newMethod(...args) {
     return ipcRenderer.invoke("channelName", ...args);
   }
   ```
3. **renderer.js** — Call through the exposed API:
   ```javascript
   const result = await window.api.newMethod(...args);
   ```
4. For main-to-renderer push events, add `webContents.send` in main.js and a corresponding `ipcRenderer.on` wrapper in preload.js.

## Common Pitfalls

- **Forgetting `await` on dialog calls** — returns a Promise object instead of the result.
- **Calling `require` in renderer** — fails with `contextIsolation` enabled; all Node.js access must go through preload.
- **Missing `mainWindow` reference** — IPC handlers need access to `webContents.send`; store the window reference at module scope.
- **IPC channel name mismatches** — `handle("pickFile")` must match `invoke("pickFile")` exactly.
- **Not checking `canceled`** — `dialog.showOpenDialog` returns `{ canceled, filePaths }`; always check `canceled` before accessing `filePaths`.
- **Listener accumulation** — `ipcRenderer.on` adds a new listener each call; if the setup function runs multiple times, listeners stack up. Consider `removeAllListeners` or guarding against duplicate registration.
