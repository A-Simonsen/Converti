# Converti

## What This Is

Desktop file conversion toolbox built with Electron and Node.js. Plugin-based architecture — each plugin is a "tool" with its own UI, rendered dynamically from metadata. Currently ships with an image converter (PNG, JPG, GIF).

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

## Project Structure

```
Converti/
  main.js                     Electron main process (window, IPC, plugin loading)
  preload.js                  contextBridge IPC bridge (window.api)
  renderer.js                 Dynamic UI: sidebar, form rendering, feedback
  index.html                  Toolbox layout: sidebar + content area
  css/style.css               Minimalistic dark theme
  core/plugin-loader.js       Scans plugins/ dir, loads metadata + modules
  plugins/
    image-converter/
      plugin.json             Metadata: id, name, icon, options[], fileFilter
      index.js                convert(inputPath, outputFolder, options)
  package.json                Entry point: main.js
```

## Architecture

### Two-Process Model

- **Main process** (`main.js`) — Node.js + OS access. Loads plugins, handles dialogs, delegates conversion to plugin modules.
- **Renderer process** (`renderer.js`) — browser context. Builds UI dynamically from plugin metadata. No Node.js access — communicates via `window.api`.

### Plugin System

Plugins are self-describing tools. Each plugin folder contains:

- `plugin.json` — metadata including `icon`, `options[]` (declarative UI), and `fileFilter`
- `index.js` — exports `convert(inputPath, outputFolder, options)`

The renderer reads plugin metadata and dynamically renders sidebar icons and option forms. Adding a new plugin auto-generates its UI.

### Plugin JSON Schema

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "icon": "🔧",
  "description": "What it does",
  "category": "category",
  "options": [
    {
      "id": "optName",
      "label": "Label",
      "type": "select",
      "choices": [{ "value": "v", "label": "L" }],
      "default": "v"
    }
  ],
  "fileFilter": { "name": "File Type", "extensions": ["ext1", "ext2"] }
}
```

### IPC Channels

| Channel              | Pattern       | Purpose                                                                                    |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `getPlugins`         | invoke/handle | Get loaded plugin metadata                                                                 |
| `pickOutputLocation` | invoke/handle | Folder picker dialog                                                                       |
| `convert`            | invoke/handle | Generic: `(pluginId, options, outputFolder)` → `{ totalFiles, successCount, failedFiles }` |
| `conversionProgress` | send/on       | Per-file progress (0-100)                                                                  |
| `conversionError`    | send/on       | Per-file error `{ file, error }`                                                           |

## Coding Conventions

- CommonJS (`require` / `module.exports`), not ES modules
- `async/await` for all async operations
- `try/catch` around file operations and dialogs
- Vanilla DOM, `document.getElementById`, `addEventListener`
- CSS custom properties for theming
- `hidden` class for show/hide (not inline styles)

## Notes

- sharp is a native module — check Node.js version compatibility if `npm install` fails
- Electron is a devDependency (correct for Electron apps)
- `"type": "commonjs"` is set in `package.json`
- CSS `@import url()` for Inter font requires internet
