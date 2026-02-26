---
name: converti-project
description: >
  Converti-specific project knowledge. Use when working on image conversion
  features, the sharp library, adding new format support, modifying the
  conversion pipeline, progress tracking, or output path logic.
---

# Converti Project Skill

## Conversion Pipeline

Full data flow from user action to file output:

1. User selects target format from `<select id="extension-selecter">` (values: `.jpg`, `.png`, `.gif`)
2. User optionally clicks "Pick Output Location" → calls `window.api.pickOutputLocation()` → result stored in `selectedOutputFolder` (module-level variable in `renderer.js`)
3. User clicks "Start Converting" → calls `window.api.pickFile(selectedExtension, selectedOutputFolder)`
4. Main process opens multi-file dialog: `dialog.showOpenDialog` with `["multiSelections", "openFile"]`
5. For each selected file:
   - Extract old extension: `path.extname(inputPath)`
   - Build new filename: `path.basename(inputPath, oldExt) + selectedExtension`
   - Determine output path: custom folder via `path.join(outputFolder, newFileName)` or in-place via `inputPath.replace(oldExt, selectedExtension)`
   - Convert: `sharp(inputPath).toFormat(extWithoutDot).toFile(outputPath)`
   - Send progress: `mainWindow.webContents.send("conversionProgress", percentage)`
6. Renderer displays `"${progress}% complete"`, clears 2 seconds after reaching 100%

## The sharp Library

- High-performance image processing backed by libvips (native C++ bindings)
- Core conversion: `sharp(inputPath).toFormat(formatString).toFile(outputPath)`
- `toFormat()` accepts format strings **without dots**: `"jpg"`, `"png"`, `"gif"`, `"webp"`, `"tiff"`, `"avif"`
- Returns a Promise — always `await`
- Quality options via format-specific methods:
  ```javascript
  sharp(input).jpeg({ quality: 80 }).toFile(output)
  sharp(input).png({ compressionLevel: 9 }).toFile(output)
  sharp(input).webp({ quality: 75 }).toFile(output)
  ```
- Chainable with other operations: `.resize()`, `.rotate()`, `.flip()`, `.sharpen()`, etc.
- Native module — requires compatible Node.js version and build tools for installation

## Adding a New Output Format

1. **index.html** — add an `<option>` to `#extension-selecter`:
   ```html
   <option value=".webp">WebP</option>
   ```
   Value **must** include the leading dot.

2. **main.js** — update the file dialog filter to accept the new format as input:
   ```javascript
   filters: [
     { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }
   ]
   ```

3. **No changes needed** in the conversion logic — `sharp(input).toFormat("webp").toFile(output)` works automatically because the format string is derived dynamically from the dropdown value.

Formats sharp supports that could be added: `webp`, `tiff`, `avif`, `heif` (HEIC).

## Progress Tracking System

- Uses an indexed `for` loop (not `for...of`) to access the index `i`
- Percentage: `Math.round(((i + 1) / totalFiles) * 100)`
- Sent from main: `mainWindow.webContents.send("conversionProgress", progress)`
- Received in renderer: `window.api.onConversionProgress(callback)`
- Displayed in `<span id="progress-text">` as `"${progress}% complete"`
- Auto-clears via `setTimeout(() => { progressText.textContent = ""; }, 2000)` at 100%

To extend (e.g., show current filename): change the IPC payload from a number to an object `{ progress, filename }` and update both main.js sender and renderer.js receiver.

## Output Path Logic

Two modes based on whether `outputFolder` is truthy:

```javascript
// With custom output folder
outputPath = path.join(outputFolder, fileName + selectedExtension);

// Without (same folder as source)
outputPath = inputPath.replace(oldExt, selectedExtension);
```

Note: the in-place `String.replace` replaces only the first occurrence. A more robust alternative:
```javascript
outputPath = path.join(path.dirname(inputPath), fileName + selectedExtension);
```

## UI Structure

Element IDs (referenced by `renderer.js`):
- `#extension-selecter` — format dropdown (note: typo in "selecter", keep consistent)
- `#pick-output-location-btn` — optional output folder picker button
- `#pick-file-btn` — triggers file selection and conversion
- `#progress-text` — progress display span

Renderer state (module-level variables in `renderer.js`):
- `selectedOutputFolder` (`let`, initially `null`) — persists chosen output folder across clicks
- `progressText` (`const`) — cached DOM reference to `#progress-text`

## Known Limitations

- No input validation (converting PNG→PNG creates a duplicate)
- No per-file error handling — one failure in the batch stops all remaining files
- No drag-and-drop file support
- No image preview before conversion
- No conversion quality/resize options exposed in UI
- `onConversionProgress` listener accumulates if called multiple times (no `removeListener`)
- Progress is file-count-based, not byte-based (1MB and 100MB files count equally)
