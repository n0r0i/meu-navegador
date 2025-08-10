const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPopupAPI', {
  menuAction: (action) => ipcRenderer.send('menu-action', action)
});