// Arquivo: preload-settings.js
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('settingsAPI', {
    openBgDialog: () => ipcRenderer.send('open-bg-dialog'),
    onBgSelected: (callback) => ipcRenderer.on('bg-selected', (_e, path) => callback(path)),
    removeBgImage: () => ipcRenderer.send('remove-bg-image')
});