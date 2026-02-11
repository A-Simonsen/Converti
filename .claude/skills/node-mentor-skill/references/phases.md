# Learning Phases — Detailed Breakdown

## Table of Contents
- Phase 0: Environment & Foundations
- Phase 1: Hello Electron
- Phase 2: IPC & Preload
- Phase 3: Image Conversion (Hardcoded)
- Phase 4: Extract the Plugin Interface
- Phase 5: Plugin Registry & Dynamic UI
- Phase 6: Build More Plugins
- Phase 7: Polish & Extend

---

## Phase 0: Environment & Foundations

**Goal:** Comfortable with Node.js runtime, npm, and the module system.

### Learning Objectives
- Understand what Node.js IS (runtime, not a framework — compare to .NET CLR)
- Create and understand `package.json` (compare to `.csproj`)
- Install and use npm packages (compare to NuGet)
- Understand CommonJS (`require`/`module.exports`) and ES modules (`import`/`export`)
- Use `fs` module to read/write files
- Understand async patterns: callbacks → promises → async/await

### Checkpoint Questions (student should be able to answer)
- "What's the difference between Node.js and a browser's JavaScript?"
- "What does `npm init` create and why?"
- "What is `node_modules` and why shouldn't you commit it?"
- "Show me three ways to handle async operations in Node."

### Suggested Exercises
1. Create a Node.js script that reads a text file and counts the words
2. Create a module that exports a function, import it in another file
3. Rewrite the file reader using callbacks, then promises, then async/await
4. Install `chalk` from npm, use it to colorize the word count output

### Bridge Points
- `package.json` → `.csproj` / `pom.xml`
- `npm install` → `dotnet add package` / Maven dependencies
- `require()` → `using` statements
- `node_modules` → NuGet packages folder / `.m2` directory
- Event loop → `Task` scheduler in C#, but single-threaded

### Mentor Notes
Let them hit the "callback hell" problem naturally in exercise 3. It makes the
motivation for promises and async/await visceral rather than theoretical.

---

## Phase 1: Hello Electron

**Goal:** Running Electron app with a window that displays HTML.

### Learning Objectives
- Understand the two-process model (main + renderer)
- Create a BrowserWindow that loads an HTML file
- Use Electron DevTools (they already know browser DevTools concepts)
- Understand why Electron exists (compare to WPF/WinForms for desktop)

### Checkpoint Questions
- "Which process has access to Node.js APIs? Which has access to the DOM?"
- "Why are there two separate processes?"
- "What happens if you try to use `require('fs')` in renderer.js?"

### Suggested Exercises
1. Create a minimal Electron app that shows "Hello World" in a window
2. Add a button that logs to the DevTools console when clicked
3. Style the window with a CSS file
4. Make the window size and title configurable

### Bridge Points
- Main process → Backend server in ASP.NET
- Renderer process → Frontend browser client
- BrowserWindow → like opening a `WebView` or WPF `Frame`

### Mentor Notes
Let them discover that `require` doesn't work in the renderer on their own.
This naturally motivates Phase 2 (preload + IPC). If they google and enable
`nodeIntegration: true`, explain why that's insecure and redirect to preload.

---

## Phase 2: IPC & Preload

**Goal:** Secure communication between renderer and main process.

### Learning Objectives
- Understand `contextBridge` and `preload.js`
- Send messages from renderer to main with `ipcRenderer.invoke`
- Handle messages in main with `ipcMain.handle`
- Understand the security implications (why not just expose everything?)

### Checkpoint Questions
- "What is the preload script's special position?"
- "Why do we use `contextBridge.exposeInMainWorld` instead of directly
  requiring modules?"
- "What's the difference between `send/on` and `invoke/handle`?"
- "How is IPC similar to HTTP requests between frontend and backend?"

### Suggested Exercises
1. Create a button that, when clicked, asks main process for the current time
2. Create an input field — user types a folder path, main process returns
   the list of files in it
3. Add error handling: what if the folder doesn't exist?

### Bridge Points
- IPC → SignalR hub methods / HTTP controller actions
- `invoke`/`handle` → request/response pattern (like `HttpClient.GetAsync`)
- `send`/`on` → SignalR's fire-and-forget messages
- Preload → like a middleware layer or API gateway
- Security model → same reason you don't expose your database directly

### Mentor Notes
This is where security concepts matter. Don't let them skip this. Draw the
parallel to why ASP.NET controllers exist instead of letting the browser
talk directly to the database.

---

## Phase 3: Image Conversion (Hardcoded)

**Goal:** Convert images between formats with a working UI. All logic lives
directly in main process — no plugin system yet.

### Learning Objectives
- Use `sharp` (or `jimp`) for image manipulation
- Work with Node.js `Buffer` and file streams
- Handle file dialogs (Electron's `dialog` API)
- Build a functional UI: select file → choose output format → convert
- Understand and handle errors in async workflows

### Checkpoint Questions
- "What is a Buffer and how does it relate to byte arrays in C#?"
- "Why is image processing done in the main process, not the renderer?"
- "What happens if the user selects a file that isn't an image?"

### Suggested Exercises
1. Install `sharp`, write a script that converts a PNG to JPEG from CLI
2. Add a file picker button that opens a native dialog
3. Add format selection (dropdown: PNG, JPEG, WebP, TIFF)
4. Show a success/error message in the UI after conversion
5. **Stretch:** Show a preview of the selected image before converting

### Bridge Points
- `Buffer` → `byte[]` in C# / `byte[]` in Java
- `sharp` pipeline → LINQ-style chaining (`image.resize().toFormat().toFile()`)
- `dialog.showOpenDialog` → `OpenFileDialog` in WinForms/WPF
- Error handling → try/catch is identical; unhandled promise rejections are
  like unhandled `Task` exceptions

### Mentor Notes
This phase produces the FIRST tangible result. Let them enjoy the dopamine.
Don't immediately start refactoring into plugins. Let the code get a little
messy — they need to feel the pain of tightly coupled code to appreciate
the plugin refactor in Phase 4.

---

## Phase 4: Extract the Plugin Interface

**Goal:** Refactor the hardcoded converter into the first plugin, creating the
plugin contract in the process.

### Learning Objectives
- Identify what should be abstracted (the plugin contract)
- Design an interface/contract in JavaScript (no `interface` keyword!)
- Understand dynamic `require()` / `import()` for loading modules
- Create `plugin.json` for metadata
- Move image conversion code into a plugin folder

### Checkpoint Questions
- "If you were designing this in C#, what would the `IPlugin` interface
  look like?"
- "How can we enforce a contract in JavaScript without the `interface` keyword?"
- "What metadata does the core app need to know about a plugin?"
- "What's the difference between `require` (static) and `import()` (dynamic)?"

### Suggested Exercises
1. Write out (on paper or in comments) what every plugin needs to provide
2. Create the `plugin.json` schema — what fields are required?
3. Move the image converter into `plugins/image-converter/`
4. Create `plugin-loader.js` that reads a plugin folder and loads it
5. Wire the loader into the main app so the image converter works exactly
   as before, but now loaded as a plugin

### Bridge Points
- Plugin contract → `interface IPlugin` in C# / abstract class in Java
- `plugin.json` → assembly metadata / NuGet `.nuspec`
- Dynamic loading → `Assembly.LoadFrom()` / reflection in C#
- Plugin folder scanning → like how .NET loads DLLs from a directory
- Registry pattern → dependency injection container

### Mentor Notes
THIS IS THE CRITICAL PHASE. Spend time here. The student should design the
contract themselves. Ask them to sketch it on paper first. Compare their design
to C# interfaces. Only show the JavaScript implementation pattern after they
have the design.

Key teaching moment: JavaScript duck typing means the "contract" is enforced
by convention and runtime validation, not the compiler. Discuss trade-offs
vs. TypeScript.

---

## Phase 5: Plugin Registry & Dynamic UI

**Goal:** Multiple plugins loaded dynamically, UI adapts based on which
plugins are available.

### Learning Objectives
- Registry pattern for managing plugins
- Dynamic HTML generation based on plugin metadata
- Plugin selection UI (sidebar, tabs, or dropdown)
- Each plugin can contribute its own options UI
- Understand the Observer pattern for plugin events

### Checkpoint Questions
- "How should the app discover which plugins exist on startup?"
- "How should a plugin tell the app what UI options it needs?"
- "What happens if a plugin fails to load? Should the whole app crash?"

### Suggested Exercises
1. Build `plugin-registry.js` that holds all loaded plugins
2. Generate the UI sidebar/list from the registry
3. When user selects a plugin, show that plugin's options panel
4. Add error boundaries — one bad plugin shouldn't crash the app
5. Create a second dummy plugin (even one that just logs "hello") to test

### Bridge Points
- Registry → DI container / service locator pattern
- Dynamic UI → like Razor components rendering from model data
- Plugin contributing UI → like Blazor `RenderFragment` or WPF `DataTemplate`
- Error isolation → similar to middleware exception handling in ASP.NET

---

## Phase 6: Build More Plugins

**Goal:** Validate the plugin architecture by building 2-3 more plugins.

### Learning Objectives
- Test the plugin contract with diverse use cases
- Identify where the contract needs to be extended
- Handle different input/output types (text, files, generated content)
- Iterative design refinement

### Plugin Ideas (student picks, don't assign)
- **Lorem Ipsum Generator** — text output, configurable paragraphs/words
- **QR Code Generator** — takes text, outputs image (uses `qrcode` npm package)
- **Markdown to HTML** — file input, file/preview output
- **Color Palette Generator** — generates and displays color schemes
- **Hash Generator** — takes file or text, outputs hash values
- **CSV to JSON** — file format conversion
- **Base64 Encoder/Decoder** — text transform

### Checkpoint Questions
- "Does your plugin contract handle plugins that don't take file input?"
- "What would you need to change in the contract to support preview?"
- "Are there patterns common to all your plugins that should move to core?"

### Mentor Notes
If the contract breaks for a new plugin type, that's GREAT. It means the
student gets to experience iterative API design. Guide them through refactoring
the contract without breaking existing plugins — this is a real engineering skill.

---

## Phase 7: Polish & Extend

**Goal:** Production-quality touches and optional advanced features.

### Learning Objectives
- Error handling strategy (global error boundaries, user-friendly messages)
- Settings/preferences persistence (electron-store or JSON file)
- Drag-and-drop file input
- Progress indicators for long operations
- App packaging with electron-builder
- Basic testing with Jest or Node's built-in test runner

### Optional Advanced Topics
- Plugin hot-reloading (file watcher + re-import)
- Plugin marketplace UI (list available plugins from a JSON manifest)
- TypeScript migration (one module at a time)
- Plugin dependency management
- Custom themes/dark mode

### Mentor Notes
Let the student choose what interests them. Not everything needs to be built.
The goal is to have learned Node.js deeply through the process, not to ship
a perfect product.
