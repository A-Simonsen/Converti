const fs = require("fs");
const path = require("path");

function loadPlugins() {
  const pluginsDir = path.join(__dirname, "../plugins");
  const pluginNames = fs.readdirSync(pluginsDir);
  const plugins = [];

  pluginNames.forEach((pluginName) => {
    const pluginDir = path.join(pluginsDir, pluginName);

    if (!fs.statSync(pluginDir).isDirectory()) return;

    const metadataPath = path.join(pluginDir, "plugin.json");
    const modulePath = path.join(pluginDir, "index.js");

    if (!fs.existsSync(metadataPath) || !fs.existsSync(modulePath)) {
      console.warn(
        `Skipping plugin "${pluginName}": missing plugin.json or index.js`,
      );
      return;
    }

    try {
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
    } catch (error) {
      console.error(`Failed to load plugin "${pluginName}": ${error.message}`);
    }
  });

  return plugins;
}

module.exports = { loadPlugins };
