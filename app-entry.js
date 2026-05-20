const { app, BrowserWindow } = require('electron');
const path = require('path');

function createStudioDesktopWindow() {
    const desktopWin = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#141416',
        title: "Create Recipe Generator",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    desktopWin.setMenuBarVisibility(false);

    desktopWin.loadFile('index.html');
}

app.whenReady().then(() => {
    createStudioDesktopWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createStudioDesktopWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
