const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createStudioDesktopWindow() {
    const desktopWin = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 950,
        minHeight: 650,
        backgroundColor: '#141416',
        title: 'Create Recipe Generator',
        icon: process.platform === 'win32' ? path.join(__dirname, 'src', 'main', 'assets', 'icon.ico') : path.join(__dirname, 'src', 'main', 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'src/preload.js')
        }
    });

    desktopWin.setMenuBarVisibility(false);
    desktopWin.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    desktopWin.loadFile(path.join(__dirname, 'src', 'index.html'));
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
