const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPopupAPI', {
  // A função que o menu.js vai chamar para enviar uma ação para o main.js
  menuAction: (action) => ipcRenderer.send('menu-action', action)
});