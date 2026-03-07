const fs = require("fs");
const path = require("path");

function loadPlugins() {
  const pluginsDir = path.join(__dirname, "../plugins");
  const pluginNames = fs.readdirSync(pluginsDir);
  const plugins = [];

  pluginNames.forEach((pluginName) => {
    const pluginDir = path.join(pluginsDir, pluginName);

    // Skip non-directories
    if (!fs.statSync(pluginDir).isDirectory()) return;

    // Load plugin metadata from plugin.json
    const metadataPath = path.join(pluginDir, "plugin.json");
    const modulePath = path.join(pluginDir, "index.js");

    if (!fs.existsSync(metadataPath) || !fs.existsSync(modulePath)) {
      console.warn(
        `Skipping plugin "${pluginName}": missing plugin.json or index.js`,
      );
      return;
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    const pluginModule = require(modulePath);
    const resolvedMetadata =
      typeof pluginModule.getMetadata === "function"
        ? pluginModule.getMetadata(metadata)
        : metadata;

    console.log(
      `Loaded plugin: ${resolvedMetadata.name} (${resolvedMetadata.id})`,
    );
    plugins.push({ metadata: resolvedMetadata, module: pluginModule });
  });

  return plugins;
}

module.exports = { loadPlugins };
