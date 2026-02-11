# Plugin Architecture Patterns

Read this when entering Phase 4 (Extract the Plugin Interface) or when the
student is designing the plugin system.

---

## Plugin Design Principles

These are principles to GUIDE THE STUDENT toward, not to lecture them on.
Let them discover these through building.

### 1. Convention Over Configuration
Plugins follow a predictable structure. If every plugin has `plugin.json` and
`index.js` in its folder, the loader knows what to expect without complex
configuration.

**C# parallel:** ASP.NET controller discovery — put a class in the right
namespace, inherit from `ControllerBase`, and the framework finds it.

### 2. Contract by Convention (Duck Typing)
JavaScript doesn't have `interface`. The plugin "contract" is enforced by:
- Documentation (what a plugin SHOULD export)
- Runtime validation (check if methods exist before calling)
- Clear error messages when a plugin doesn't conform

**C# parallel:** Imagine dependency injection without interfaces — you'd check
at runtime if the object has the right methods. That's duck typing.

### 3. Fail Gracefully
One broken plugin should never crash the app. Load plugins in try/catch.
Log errors. Skip broken plugins. Continue.

### 4. Metadata Separate from Code
`plugin.json` holds name, version, description, capabilities. The core app
reads metadata without executing plugin code. Like reading a NuGet package
manifest vs. actually loading the assembly.

---

## The Plugin Contract

DO NOT show this to the student. Guide them to design it. These are the
concepts they should arrive at:

### Metadata (plugin.json)
```
- name: Human-readable name
- id: Unique identifier (kebab-case)
- version: Semver string
- description: What it does
- category: Grouping (converter, generator, utility)
- input: What it accepts (file, text, none)
- output: What it produces (file, text, preview)
```

### Interface (index.js exports)
```
- init(): Setup, allocate resources
- execute(input, options): Do the work, return result
- getUI(): Return HTML string for plugin-specific options (optional)
- destroy(): Cleanup (optional)
```

### Teaching Sequence
1. Ask: "In C#, if you had to define `IPlugin`, what methods would it need?"
2. Let them draft it. Don't correct yet.
3. Ask: "Now, how would the main app know a plugin's name and category
   WITHOUT running it?" → leads to plugin.json
4. Ask: "What if a plugin needs user options the main app doesn't know about?"
   → leads to getUI()
5. Ask: "How would you express this contract in JavaScript, where there are
   no interfaces?" → leads to duck typing + validation discussion

---

## Plugin Loader Patterns

### Pattern A: Directory Scanner
Scan a `plugins/` folder, find subfolders, read `plugin.json`, `require`
the `index.js`.

```
Pseudocode:
1. Read all directories in plugins/
2. For each directory:
   a. Check if plugin.json exists
   b. Read and parse plugin.json
   c. Validate required fields
   d. require() the index.js
   e. Validate the exported object has required methods
   f. Register in the registry
```

**C# parallel:** Like ASP.NET scanning assemblies for controllers, or
loading DLLs from a plugins directory with `Assembly.LoadFrom()`.

### Pattern B: Manifest File
A central `plugins.json` lists all active plugins. More control, but requires
manual registration.

### Recommendation
Start with Pattern A — it's simpler and more magical (add folder → plugin
appears). Can add Pattern B later for enable/disable functionality.

---

## Plugin Registry

The registry is a central store of loaded plugins. It provides:
- `register(plugin)` — Add a plugin
- `getAll()` — List all plugins
- `getById(id)` — Find specific plugin
- `getByCategory(category)` — Filter by type

**C# parallel:** Like a DI container's service collection. Or a dictionary
of registered services.

### Teaching Approach
Ask: "You used the Singleton pattern in your Java project. Would that work
for the plugin registry? Why or why not?"

This leads to a good discussion about:
- Single instance (yes, Singleton makes sense here)
- But it should be initialized with data, not truly global
- The student might design it as a class with static methods, or a module-
  level object (both valid in JS)

---

## UI Generation from Plugins

### The Challenge
Each plugin might need different UI controls. The image converter needs a
format dropdown. The lorem generator needs a paragraph count. The QR
generator needs a text input.

### Approaches (let the student evaluate)

**Approach 1: HTML String**
Plugin returns an HTML string. Simple. Easy to inject.
Downside: XSS risk, hard to get data back out.

**Approach 2: UI Description Object**
Plugin returns a schema: `{ fields: [{ type: 'select', options: [...] }] }`
Core app renders it. Safer. More structured.
Downside: More complex to implement.

**Approach 3: Hybrid**
Plugin returns HTML string, but core app sanitizes it and attaches event
listeners through a defined protocol.

### Recommendation for Learning
Start with Approach 1 (HTML string) — it works and teaches innerHTML
patterns. Discuss the security implications. If the student wants to improve
it, guide them to Approach 2 as a refactor exercise.

---

## Advanced Patterns (Phase 7+)

### Plugin Events
Plugins can emit events that the core app or other plugins listen to.
Uses Node.js EventEmitter.

### Plugin Dependencies
Plugin A declares it needs Plugin B. The loader resolves the dependency
graph. Complex but teaches important concepts.

### Hot Reloading
Watch plugin folders for changes. Unload old version, load new version.
Uses `fs.watch()`. Tricky in Node.js due to module caching — `require`
caches modules, so you need to invalidate the cache.

### Plugin Sandboxing
Run plugins in a `vm` context or worker thread for isolation. Advanced
security topic. Only if the student is interested.
