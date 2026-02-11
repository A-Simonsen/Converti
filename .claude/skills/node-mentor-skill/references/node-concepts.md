# Node.js Concepts — C#/Java Bridge Reference

Use this file when the student encounters a new Node.js concept. Find the
bridge to their existing knowledge and use it to explain.

---

## Module System

### The Concept
Node.js has TWO module systems. This is confusing. Acknowledge it.

### CommonJS (older, still everywhere)
```javascript
// Exporting (like making a class public)
module.exports = { myFunction, MyClass };
// Importing (like 'using' + instantiation)
const { myFunction } = require('./myModule');
```

### ES Modules (newer, standard JavaScript)
```javascript
// Exporting
export function myFunction() { }
export default class MyClass { }
// Importing
import { myFunction } from './myModule.js';
import MyClass from './myModule.js';
```

### C# Bridge
| Node.js | C# Equivalent |
|---------|---------------|
| `module.exports` | `public` access modifier on a class/method |
| `require('./file')` | `using MyNamespace;` + instantiation |
| `import from` | Same as above, but standard JS |
| `package.json` | `.csproj` file |
| `node_modules/` | NuGet packages cache |

### Java Bridge
| Node.js | Java Equivalent |
|---------|----------------|
| `module.exports` | `public` class with public methods |
| `require('./file')` | `import package.ClassName;` |
| `package.json` | `pom.xml` / `build.gradle` |

### Common Gotcha
There is no automatic namespace scoping. If two packages export the same name,
you handle it manually with aliases. This is different from C# namespaces.

---

## Async Patterns

### The Concept
Node.js is single-threaded with an event loop. ALL I/O is async by default.
This is the #1 mind-shift from C#/.NET where threads are the default.

### Evolution (teach in this order)
1. **Callbacks** — The OG pattern. Teach for understanding, not for use.
2. **Promises** — Like `Task<T>` in C#. `.then()` chains.
3. **async/await** — Identical syntax to C#. Use this in practice.

### C# Bridge
| Node.js | C# Equivalent |
|---------|---------------|
| `Promise` | `Task<T>` |
| `async function` | `async Task<T> Method()` |
| `await promise` | `await task` |
| `Promise.all([])` | `Task.WhenAll()` |
| `Promise.race([])` | `Task.WhenAny()` |
| Event loop | ThreadPool + SynchronizationContext |
| `process.nextTick()` | `Task.Yield()` (roughly) |

### Key Difference
In C#, `async` methods run on thread pool threads. In Node.js, everything
runs on ONE thread. The event loop handles scheduling. This means:
- CPU-heavy work BLOCKS everything (no parallel threads to save you)
- I/O is non-blocking by nature (OS handles it, event loop picks up results)
- `worker_threads` exist for CPU work (like `Task.Run()` in C#)

### Common Gotcha
Forgetting `await` on a promise doesn't cause a compile error — it just
silently returns the promise object. The student WILL hit this.

---

## Error Handling

### The Concept
Same try/catch as C# and Java, but with async twists.

### Patterns
- Synchronous: `try { } catch (err) { }` — identical to C#
- Promises: `.catch()` — like `.ContinueWith(t => t.Exception)`
- Async/await: `try { await ... } catch (err) { }` — identical to C#
- Unhandled rejections: `process.on('unhandledRejection')` — like
  `AppDomain.UnhandledException`

### Key Difference
JavaScript errors don't have typed exception hierarchies like C#'s
`IOException`, `ArgumentException`, etc. You check `err.code` or
`err.message` strings. This feels messy to someone from C#. Acknowledge it.

---

## File System (`fs`)

### The Concept
Built-in module for all file operations. Has sync and async versions.

### C# Bridge
| Node.js | C# Equivalent |
|---------|---------------|
| `fs.readFile()` | `File.ReadAllBytesAsync()` |
| `fs.writeFile()` | `File.WriteAllBytesAsync()` |
| `fs.readdir()` | `Directory.GetFiles()` |
| `fs.stat()` | `FileInfo` |
| `fs.promises` | The async versions (always prefer these) |
| `path.join()` | `Path.Combine()` |
| `__dirname` | `AppDomain.CurrentDomain.BaseDirectory` |

### Common Gotcha
Always use `path.join()` for paths, never string concatenation. Especially
important on Windows vs macOS/Linux. Same lesson as `Path.Combine` in C#.

---

## Event Emitter

### The Concept
Node.js's built-in Observer pattern. Many core APIs are EventEmitters.

### C# Bridge
| Node.js | C# Equivalent |
|---------|---------------|
| `emitter.on('event', handler)` | `object.Event += handler` |
| `emitter.emit('event', data)` | `Event?.Invoke(data)` |
| `emitter.removeListener()` | `object.Event -= handler` |
| `emitter.once()` | Subscribe + unsubscribe after first fire |

### When It Matters
The student already knows the Observer pattern from their design patterns
coursework. Electron's IPC is built on EventEmitter. Plugin events can use it.

---

## Package Management (npm)

### C# Bridge
| npm | NuGet / dotnet CLI |
|-----|-------------------|
| `npm init` | `dotnet new` |
| `npm install <pkg>` | `dotnet add package <pkg>` |
| `npm install --save-dev` | Dev dependency (like test packages) |
| `package.json` dependencies | `.csproj` PackageReference |
| `package-lock.json` | `packages.lock.json` |
| `npx` | `dotnet tool run` |
| `npm run <script>` | `dotnet run` / MSBuild targets |

### Semantic Versioning
npm uses semver ranges (`^1.2.3`, `~1.2.3`). Explain the caret vs tilde
distinction — C# NuGet uses similar version ranges but the syntax differs.

---

## Buffer & Streams

### The Concept
`Buffer` is Node.js's way of handling binary data. Streams are for processing
data in chunks without loading everything into memory.

### C# Bridge
| Node.js | C# Equivalent |
|---------|---------------|
| `Buffer` | `byte[]` |
| `Buffer.from('text')` | `Encoding.UTF8.GetBytes("text")` |
| `buffer.toString()` | `Encoding.UTF8.GetString(bytes)` |
| Readable Stream | `Stream` with `Read()` |
| Writable Stream | `Stream` with `Write()` |
| `.pipe()` | `Stream.CopyTo()` |

### When It Matters
Image conversion (Phase 3) works with Buffers. Large file handling benefits
from streams. Don't teach streams early — introduce when they hit a memory
issue or when processing large files.

---

## Testing

### The Concept
Node.js has a built-in test runner (`node:test`) since v18, plus popular
frameworks like Jest and Vitest.

### C# Bridge
| Node.js | NUnit Equivalent |
|---------|-----------------|
| `describe()` | `[TestFixture]` |
| `it()` / `test()` | `[Test]` |
| `assert.strictEqual()` | `Assert.AreEqual()` |
| `beforeEach()` | `[SetUp]` |
| `afterEach()` | `[TearDown]` |
| Jest mocks | NUnit + Moq |

### Mentor Note
The student has NUnit experience. Testing concepts will transfer directly.
Focus on the syntax differences, not the concepts.
