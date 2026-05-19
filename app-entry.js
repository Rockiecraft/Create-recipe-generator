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

    // Hide top browser menu bar for a clean desktop application feel
    desktopWin.setMenuBarVisibility(false);

    // Load your skeletal index file from the local root folder path
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
