# Electron Security Model

Read this when entering Phase 2 (IPC & Preload) or when the student
asks security-related questions.

---

## Why Security Matters in Electron

Electron apps run with FULL system access — they can read/write files,
execute commands, access the network. The renderer process displays HTML,
which could include untrusted content. If renderer gets full Node.js access,
any XSS vulnerability = full system compromise.

### C# Analogy
Think of it like a web app where the frontend JavaScript could directly
execute SQL queries on your database. That's what `nodeIntegration: true` does.
The preload + IPC pattern is like having controllers/API endpoints between
the frontend and the backend.

---

## The Security Model

```
┌──────────────────────┐     IPC Messages     ┌─────────────────────┐
│   Renderer Process   │ ◄──────────────────► │    Main Process     │
│                      │                       │                     │
│  - HTML, CSS, JS     │                       │  - Node.js APIs     │
│  - DOM access        │    contextBridge      │  - File system      │
│  - NO Node.js        │ ◄──────────────────  │  - OS access        │
│  - Sandboxed         │    (preload.js)       │  - Full privileges  │
└──────────────────────┘                       └─────────────────────┘
```

### The Three Layers

1. **Main Process** — Has full Node.js + OS access. Like a backend server.
2. **Preload Script** — Runs in renderer context but has limited Node.js
   access. Acts as the bridge. Like an API gateway.
3. **Renderer Process** — Pure web context. No Node.js. Like a browser tab.

---

## Secure Defaults (What to Always Set)

```javascript
// When creating BrowserWindow, ALWAYS use:
const win = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // NEVER enable this
    contextIsolation: true,      // ALWAYS keep this true
    sandbox: true,               // Enable sandbox
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### Teaching Approach
Don't just tell the student these settings — explain each one:
- **nodeIntegration: false** — "Why would it be bad if your HTML page could
  require('child_process') and execute shell commands?"
- **contextIsolation: true** — "This ensures the preload script's globals
  can't be tampered with by the renderer page."
- **sandbox: true** — "Extra OS-level sandboxing on the renderer."

---

## IPC Patterns

### Pattern 1: Request/Response (invoke/handle)
Best for: Fetching data, performing operations, getting results.
Like: HTTP GET/POST request to an API endpoint.

```
Renderer → ipcRenderer.invoke('channel', data)
Main    → ipcMain.handle('channel', handler) returns result
```

### Pattern 2: Fire-and-Forget (send/on)
Best for: Notifications, logs, one-way events.
Like: SignalR fire-and-forget messages.

```
Renderer → ipcRenderer.send('channel', data)
Main    → ipcMain.on('channel', handler)
```

### Pattern 3: Main-to-Renderer (webContents.send)
Best for: Push updates, progress notifications, status changes.
Like: SignalR server-to-client push.

```
Main    → win.webContents.send('channel', data)
Renderer → ipcRenderer.on('channel', handler)  // exposed via preload
```

### Which to Use When
Guide the student to choose based on their needs:
- Converting a file → invoke/handle (need the result)
- Logging → send/on (fire and forget)
- Progress updates → webContents.send (main pushes to renderer)

---

## Preload Script Best Practices

### Expose Minimal API
Only expose what the renderer actually needs. Name channels clearly.

### Validate in Main
Never trust data from the renderer. Validate all IPC inputs in the main
process, just like you'd validate HTTP request bodies in a controller.

### No Secrets in Renderer
Never send sensitive data (file paths, tokens, system info) to the renderer
unless the UI genuinely needs it.

---

## Common Mistakes to Watch For

1. **Enabling `nodeIntegration`** — The student will google this as a "quick
   fix." Redirect immediately.
2. **Exposing too much via preload** — Don't expose `fs` or `child_process`
   wholesale. Expose specific operations.
3. **No input validation on IPC handlers** — Just like API endpoints need
   input validation.
4. **Loading remote URLs** — For this project, only load local files.
   No `loadURL('https://...')`.
