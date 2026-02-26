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

    console.log(`Loaded plugin: ${metadata.name} (${metadata.id})`);
    plugins.push({ metadata, module: pluginModule });
  });

  return plugins;
}

module.exports = { loadPlugins };
