const fs = require("fs");
const path = require("path");

function loadPlugins() {
  const pluginNames = fs.readdirSync(path.join(__dirname, "../plugins"));
  const plugins = [];

  pluginNames.forEach((pluginName) => {
    console.log(pluginName);
    plugins.push(
      require(path.join(__dirname, "../plugins", pluginName, "index.js")),
    );
  });

  return plugins;
}
