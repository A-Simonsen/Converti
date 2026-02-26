# Converti

## What This Is

Desktop image file converter built with Electron and Node.js. Converts between PNG, JPG, and GIF with batch support and optional output folder selection.

## Tech Stack

- **Electron** v40.3.0 (devDependency) — desktop app framework
- **sharp** v0.34.5 — native image processing library (C++ bindings via libvips)
- **CommonJS** modules (`require` / `module.exports`)
- Vanilla HTML/CSS/JS — no frontend framework, no TypeScript, no build step
- **npm** as package manager

## How to Run

```
npm install
npm start        # runs: electron .
```

No test suite configured yet (`npm test` is a placeholder).

## Project Structure

```
Converti/
  main.js          Electron main process (window, IPC handlers, sharp conversion)
  preload.js       contextBridge IPC bridge (exposes window.api to renderer)
  renderer.js      UI event handlers and renderer-side state
  index.html       Single-page UI: format dropdown, buttons, progress text
  css/style.css    Minimal styling
  package.json     Entry point: main.js
```

## Architecture

Two-process Electron model:

- **Main process** (`main.js`) — full Node.js + OS access. Creates the BrowserWindow, handles file dialogs, runs sharp conversions, sends progress updates.
- **Renderer process** (`renderer.js`) — runs in the browser context. No direct Node.js access. Communicates with main exclusively through `window.api` (exposed by `preload.js`).

IPC patterns used:

- **Request-response**: `ipcRenderer.invoke()` / `ipcMain.handle()` — for file picking and conversion
- **Push events**: `webContents.send()` / `ipcRenderer.on()` — for progress updates from main to renderer

## Key Patterns

- Image conversion: `sharp(inputPath).toFormat(formatString).toFile(outputPath)`
- Format strings: HTML dropdown values have dots (`.jpg`), sharp expects none — strip with `.substring(1)`
- Batch processing: sequential `for` loop with `await` (not parallel) to enable per-file progress tracking
- Progress: `Math.round(((i + 1) / totalFiles) * 100)` sent via `webContents.send`
- Output path: custom folder → `path.join(outputFolder, newFileName)`, otherwise replace extension in-place
- Module-level `mainWindow` variable so IPC handlers can reach `webContents`
- Module-level `selectedOutputFolder` in renderer persists between button clicks

## Coding Conventions

- CommonJS (`require` / `module.exports`), not ES modules
- `async/await` for all asynchronous operations
- `try/catch` around file operations and dialog calls
- Vanilla DOM: `document.getElementById`, `addEventListener`
- Console logging for debugging (`console.log` / `console.error`)
- Single `css/style.css` file linked from `index.html`

## Notes

- sharp is a native module — if `npm install` fails, check Node.js version compatibility
- Electron is a devDependency (correct for Electron apps)
- `"type": "commonjs"` is explicitly set in `package.json`
- The `#extension-selecter` element ID contains a typo ("selecter" not "selector") — keep it consistent unless intentionally renaming across all files
