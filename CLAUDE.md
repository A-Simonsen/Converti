# Converti

## What This Is

Desktop image file converter built with Electron and Node.js. Converts between PNG, JPG, and GIF with batch support, optional output folder selection, and an extensible plugin system.

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
  main.js                     Electron main process (window, IPC handlers, plugin loading)
  preload.js                  contextBridge IPC bridge (exposes window.api to renderer)
  renderer.js                 UI event handlers, state, feedback display
  index.html                  Single-page UI: format dropdown, buttons, progress bar, status
  css/style.css               Dark-theme design system with CSS custom properties
  core/plugin-loader.js       Reads plugins/ directory, loads metadata + modules
  plugins/
    image-converter/
      plugin.json             Plugin metadata (id, name, version, category)
      index.js                Image conversion via sharp (convert function)
  package.json                Entry point: main.js
```

## Architecture

Two-process Electron model:

- **Main process** (`main.js`) — full Node.js + OS access. Creates the BrowserWindow, loads plugins at startup, handles file dialogs, delegates conversion to plugins, sends progress/error updates.
- **Renderer process** (`renderer.js`) — runs in the browser context. No direct Node.js access. Communicates with main exclusively through `window.api` (exposed by `preload.js`).

### Plugin System

- `core/plugin-loader.js` scans the `plugins/` directory at startup.
- Each plugin must have a `plugin.json` (metadata) and `index.js` (module).
- Plugins are loaded as `{ metadata, module }` objects.
- `main.js` finds the appropriate plugin by category (e.g. `"image"`) and calls its `convert()` function.
- The renderer can query available plugins via the `getPlugins` IPC channel.

### IPC Channels

| Channel              | Pattern       | Direction       | Purpose                                                                                |
| -------------------- | ------------- | --------------- | -------------------------------------------------------------------------------------- |
| `getPlugins`         | invoke/handle | Renderer → Main | Get list of loaded plugin metadata                                                     |
| `pickOutputLocation` | invoke/handle | Renderer → Main | Open folder picker dialog                                                              |
| `pickFile`           | invoke/handle | Renderer → Main | Open file picker + run conversion, returns `{ totalFiles, successCount, failedFiles }` |
| `conversionProgress` | send/on       | Main → Renderer | Per-file progress percentage (0-100)                                                   |
| `conversionError`    | send/on       | Main → Renderer | Per-file error info `{ file, error }`                                                  |

## Key Patterns

- Image conversion delegated to plugin: `converter.convert(inputPath, outputPath)`
- Per-file error tracking: each file wrapped in its own try/catch, failures collected in `failedFiles[]`
- Result object returned from `pickFile`: `{ totalFiles, successCount, failedFiles }` — consumed by renderer for UI feedback
- Progress bar: CSS width transition driven by `conversionProgress` events
- Status messages: success (green) / error (red) with auto-hide after 5 seconds for success
- Output folder display: shown with truncated path + clear button to reset
- Dark theme: CSS custom properties for all colors, spacing, radii

## Coding Conventions

- CommonJS (`require` / `module.exports`), not ES modules
- `async/await` for all asynchronous operations
- `try/catch` around file operations and dialog calls
- Vanilla DOM: `document.getElementById`, `addEventListener`
- Console logging for debugging (`console.log` / `console.error`)
- Single `css/style.css` file linked from `index.html`
- CSS custom properties (`--var-name`) for theming

## Notes

- sharp is a native module — if `npm install` fails, check Node.js version compatibility
- Electron is a devDependency (correct for Electron apps)
- `"type": "commonjs"` is explicitly set in `package.json`
- The `@import url()` for Google Fonts in CSS requires an internet connection
