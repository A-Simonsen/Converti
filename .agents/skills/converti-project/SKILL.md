---
name: converti-project
description: Use when working on the Converti app itself: plugin loading, generic conversion flow, renderer state, dynamic tool UI, output-folder handling, progress or error reporting, or changes that span main.js, preload.js, renderer.js, index.html, css, core/plugin-loader.js, or the built-in plugins.
---

# Converti Project

Work from the current architecture, not the older fixed-format converter UI.

## Follow The Current App Flow

Trace the app in this order when changing behavior:

1. `main.js` loads plugins with `loadPlugins()` after `app.whenReady()`.
2. `main.js` exposes IPC handlers for `getPlugins`, `pickOutputLocation`, and `convert`.
3. `preload.js` bridges those handlers and push events onto `window.api`.
4. `renderer.js` fetches plugin metadata, renders the sidebar and option form dynamically, and starts conversion through `window.api.convert(...)`.
5. `core/plugin-loader.js` scans `plugins/*`, reads `plugin.json`, requires `index.js`, and returns `{ metadata, module }`.

Do not reintroduce a hard-coded converter-specific UI unless the user explicitly asks for that direction.

## Respect The Current Renderer Model

Treat the renderer as metadata-driven.

- `plugins` holds the metadata returned by `getPlugins()`.
- `activePluginId` tracks the selected tool.
- `selectedOutputFolder` persists the optional output directory.
- `renderSidebar()` builds one button per plugin from metadata.
- `renderOptions()` currently supports `select` options only.
- `collectOptions()` serializes rendered controls into the `options` object passed to the main process.

If a change needs a new option type, update both the plugin metadata expectations and `renderer.js` rendering/collection logic.

## Use The Actual IPC Contract

Keep channel names and payloads aligned across `main.js`, `preload.js`, and `renderer.js`.

- `getPlugins` returns metadata only.
- `pickOutputLocation` returns a folder path or `null`.
- `convert` accepts `(pluginId, options, outputFolder)` and returns either `null` on cancel or an object shaped like:

```javascript
{
  totalFiles,
  successCount,
  failedFiles,
  error,
}
```

- `conversionProgress` pushes a numeric percent.
- `conversionError` pushes `{ file, error }` for per-file failures.

When extending progress or error details, update all three layers together.

## Keep Plugin Loading Simple

Assume every plugin lives under `plugins/<plugin-name>/` and must provide:

- `plugin.json`
- `index.js`

`core/plugin-loader.js` currently:

- scans every directory under `plugins`
- skips entries missing either required file
- parses `plugin.json`
- `require`s `index.js`
- returns `{ metadata, module }`

Prefer incremental changes here. Do not add a registration system or build step unless the user asks for it.

## Match Current UI Structure

Use the existing DOM IDs when changing the renderer or markup:

- `#tool-list`
- `#empty-state`
- `#tool-view`
- `#tool-name`
- `#tool-description`
- `#tool-options`
- `#pick-output-btn`
- `#output-folder-info`
- `#output-folder-path`
- `#clear-output-btn`
- `#convert-btn`
- `#progress-area`
- `#progress-fill`
- `#progress-text`
- `#status-message`

Keep the `hidden` class based show/hide behavior unless there is a specific reason to replace it.

## Account For Current Limitations

Call out these constraints when they matter to the task:

- only `select` plugin options are rendered
- renderer listeners are registered once during startup and have no removal API
- progress is file-count based, not byte-based
- conversion is sequential inside the main-process loop
- the plugin contract is convention-based, not schema-validated
- plugin metadata is trusted after JSON parsing

If you fix one of these, update the related skill text so future agents stop relying on stale behavior.
