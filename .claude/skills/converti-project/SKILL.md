---
name: converti-project
version: 0.1.0
description: >
  This skill should be used when the user asks to "add a new image format",
  "add conversion support", "modify the conversion pipeline", "change output
  path logic", "update progress tracking", "work with sharp", "add quality
  options", "fix file conversion", "add drag and drop", or mentions the
  Converti app's UI structure, element IDs, or known limitations.
---

# Converti Project Skill

## Conversion Pipeline

Full data flow from user action to file output:

1. The target format is selected from `<select id="extension-selecter">` (values: `.jpg`, `.png`, `.gif`).
2. Optionally, clicking "Pick Output Location" calls `window.api.pickOutputLocation()` — the result is stored in `selectedOutputFolder` (module-level variable in `renderer.js`).
3. Clicking "Start Converting" calls `window.api.pickFile(selectedExtension, selectedOutputFolder)`.
4. The main process opens a multi-file dialog: `dialog.showOpenDialog` with `["multiSelections", "openFile"]`.
5. For each selected file:
   - Extract the old extension: `path.extname(inputPath)`
   - Build the new filename: `path.basename(inputPath, oldExt) + selectedExtension`
   - Determine the output path: custom folder via `path.join(outputFolder, newFileName)` or in-place via `inputPath.replace(oldExt, selectedExtension)`
   - Convert: `sharp(inputPath).toFormat(extWithoutDot).toFile(outputPath)`
   - Send progress: `mainWindow.webContents.send("conversionProgress", percentage)`
6. The renderer displays `"${progress}% complete"` and clears it 2 seconds after reaching 100%.

## The sharp Library

sharp is a high-performance image processing library backed by libvips (native C++ bindings).

- Core conversion pattern: `sharp(inputPath).toFormat(formatString).toFile(outputPath)`
- `toFormat()` accepts format strings **without dots**: `"jpg"`, `"png"`, `"gif"`, `"webp"`, `"tiff"`, `"avif"`
- Returns a Promise — always `await` the result.
- Quality options via format-specific methods:
  ```javascript
  sharp(input).jpeg({ quality: 80 }).toFile(output)
  sharp(input).png({ compressionLevel: 9 }).toFile(output)
  sharp(input).webp({ quality: 75 }).toFile(output)
  ```
- Chainable with other operations: `.resize()`, `.rotate()`, `.flip()`, `.sharpen()`, etc.
- Native module — requires a compatible Node.js version and build tools for installation.

## Adding a New Output Format

To add a new format (e.g., WebP):

1. **index.html** — Add an `<option>` to `#extension-selecter`:
   ```html
   <option value=".webp">WebP</option>
   ```
   The value **must** include the leading dot.

2. **main.js** — Update the file dialog filter to accept the new format as input:
   ```javascript
   filters: [
     { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }
   ]
   ```

3. **No changes needed** in the conversion logic — `sharp(input).toFormat("webp").toFile(output)` works automatically because the format string is derived dynamically from the dropdown value.

Formats sharp supports that could be added: `webp`, `tiff`, `avif`, `heif` (HEIC).

## Progress Tracking System

- An indexed `for` loop (not `for...of`) provides access to the index `i`.
- Percentage calculation: `Math.round(((i + 1) / totalFiles) * 100)`
- Sent from main: `mainWindow.webContents.send("conversionProgress", progress)`
- Received in renderer: `window.api.onConversionProgress(callback)`
- Displayed in `<span id="progress-text">` as `"${progress}% complete"`
- Auto-clears via `setTimeout(() => { progressText.textContent = ""; }, 2000)` at 100%.

To extend with additional data (e.g., current filename): change the IPC payload from a number to an object `{ progress, filename }` and update both the main.js sender and renderer.js receiver.

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
- `#extension-selecter` — format dropdown (note: typo "selecter" not "selector"; maintain for consistency unless intentionally renaming across all files)
- `#pick-output-location-btn` — optional output folder picker button
- `#pick-file-btn` — triggers file selection and conversion
- `#progress-text` — progress display span

Renderer state (module-level variables in `renderer.js`):
- `selectedOutputFolder` (`let`, initially `null`) — persists the chosen output folder across clicks
- `progressText` (`const`) — cached DOM reference to `#progress-text`

## Known Limitations

- No input validation (converting PNG to PNG creates a duplicate).
- No per-file error handling — one failure in the batch stops all remaining files.
- No drag-and-drop file support.
- No image preview before conversion.
- No conversion quality/resize options exposed in the UI.
- `onConversionProgress` listener accumulates if called multiple times (no `removeListener`).
- Progress is file-count-based, not byte-based (a 1MB and 100MB file count equally).
