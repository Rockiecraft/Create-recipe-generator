const { contextBridge, shell, ipcRenderer } = require('electron');
const fs = require('fs');

// opens the links in the footer in the browser
contextBridge.exposeInMainWorld('electronAPI', {
    writeRecipeFile: (data) => {
        ipcRenderer.send('write-recipe-file', data);
    },
    openExternal: (url) => shell.openExternal(url),
    readFileAsText: (filePath) => {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (err) {
            console.error('preload readFileAsText error:', err);
            return null;
        }
    },
});
