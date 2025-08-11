const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPopupAPI', {
  sendAction: (action, text) => ipcRenderer.send('popup-action', { action, text }),
  
  menuAction: (action) => {
    // Log para confirmar que a chamada passou pelo preload
    console.log(`PRELOAD-POPUP.JS: Ação "${action}" a ser enviada para o main.js.`); // Log 4
    ipcRenderer.send('menu-action', action);
  }
});