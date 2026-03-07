---
name: converti-plugin-authoring
description: Use when adding, updating, or debugging a Converti plugin, including plugin.json metadata, plugin option definitions, file filters, convert(inputPath, outputFolder, options), or renderer behavior driven by plugin metadata.
---

# Converti Plugin Authoring

Add or change plugins in the smallest surface area possible.

## Start With The Plugin Contract

Each plugin lives in `plugins/<plugin-name>/` and must provide:

- `plugin.json`
- `index.js`

`plugin.json` defines metadata consumed by the app. `index.js` exports the conversion logic used by the main process.

## Match The Current Metadata Shape

Use metadata shaped like this:

```json
{
  "id": "image-converter",
  "name": "Image Converter",
  "description": "Convert images between formats",
  "category": "image",
  "icon": "🖼️",
  "options": [
    {
      "id": "format",
      "label": "Output Format",
      "type": "select",
      "choices": [
        { "value": ".jpg", "label": "JPG" }
      ],
      "default": ".jpg"
    }
  ],
  "fileFilter": {
    "name": "Images",
    "extensions": ["png", "jpg", "jpeg", "gif"]
  }
}
```

Keep values practical for the current renderer:

- `id` must be stable and unique
- `icon` is rendered directly as button text
- `options` should use `type: "select"` unless you are also updating renderer support for more types
- `default` should match one of the choice values

## Export The Expected Module Interface

`index.js` must export:

```javascript
async function convert(inputPath, outputFolder, options) {
  // perform work
}

module.exports = { convert };
```

The main process calls `await plugin.module.convert(inputPath, outputFolder, options)`.

Inside `convert(...)`:

- read values from `options`
- derive the output path
- write the output file
- throw an `Error` when a single file fails so the main process can record that failure

Do not open dialogs or touch renderer state inside the plugin module.

## Rely On The Existing App Behavior

The app already handles:

- plugin discovery through `core/plugin-loader.js`
- sidebar rendering from plugin metadata
- dynamic option form rendering for `select` options
- output-folder selection
- per-file progress updates
- per-file error reporting

When adding a normal plugin, prefer changing only the new plugin folder.

## Change Shared App Code Only When Required

Update shared code outside the plugin only if the plugin needs a new capability such as:

- a new option input type beyond `select`
- richer progress payloads
- validation before conversion starts
- plugin categories or grouping logic that the UI does not yet support

When that happens, update the metadata contract, renderer rendering path, and any IPC payloads together.

## Use A Safe Implementation Checklist

1. Create `plugins/<plugin-name>/plugin.json`.
2. Create `plugins/<plugin-name>/index.js`.
3. Ensure `plugin.json` and `index.js` are both present so `core/plugin-loader.js` will load the plugin.
4. Keep the plugin module CommonJS.
5. Keep option definitions compatible with current renderer support.
6. Make file output deterministic and avoid mutating the input file in place unless explicitly requested.
7. Test the plugin through the normal app flow, not by bypassing the loader contract.
