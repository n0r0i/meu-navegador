const { contextBridge, ipcRenderer } = require('electron');

// Expõe uma API segura para a janela da BrowserView
contextBridge.exposeInMainWorld('electronViewAPI', {
  navigateTo: (url) => ipcRenderer.send('navigate-current-tab', url)
});


// O código para o pop-up e menu de contexto que já tínhamos continua aqui...
// (O resto do seu preload-view.js permanece o mesmo, se tiver mais código nele)
let debounceTimer;
document.addEventListener('selectionchange', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        if (selectedText.length > 0 && !document.querySelector("input:focus, textarea:focus")) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            ipcRenderer.send('show-selection-popup', { text: selectedText, rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height), } });
        } else {
            ipcRenderer.send('hide-selection-popup');
        }
    }, 150);
});

window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    clearTimeout(debounceTimer);
    ipcRenderer.send('hide-selection-popup');
    const selection = window.getSelection().toString().trim();
    ipcRenderer.send('show-context-menu', selection);
});