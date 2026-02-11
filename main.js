const {app, BrowserWindow} = require('electron');

function main() {

    app.whenReady().then(() => {
        const window = new BrowserWindow(
            {
                width: 600, 
                height: 600
            });
        window.loadFile('index.html');

    });
}
main();
