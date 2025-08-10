const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    createTab: (id, url) => ipcRenderer.send('create-tab', id, url),
    setActiveTab: (id) => ipcRenderer.send('set-active-tab', id),
    closeTab: (id) => ipcRenderer.send('close-tab', id),
    navigateTo: (url) => ipcRenderer.send('navigate-to', url),
    goBack: () => ipcRenderer.send('go-back'),
    goForward: () => ipcRenderer.send('go-forward'),
    reload: () => ipcRenderer.send('reload'),
    onTabUpdated: (callback) => ipcRenderer.on('tab-updated', (_event, data) => callback(data)),
    menuItemClicked: (itemName) => ipcRenderer.send('menu-item-clicked', itemName),
    getHistory: () => ipcRenderer.invoke('get-history'),
    clearHistory: () => ipcRenderer.send('clear-history'),
    deleteHistoryItem: (timestamp) => ipcRenderer.send('delete-history-item', timestamp),
    toggleTor: () => ipcRenderer.send('toggle-tor'),
    onTorStatusChanged: (callback) => ipcRenderer.on('tor-status-changed', (_event, isEnabled) => callback(isEnabled)),
    toggleAdBlocker: () => ipcRenderer.send('toggle-adblocker'),
    onAdBlockerStatusChanged: (callback) => ipcRenderer.on('adblocker-status-changed', (_event, isEnabled) => callback(isEnabled)),
    addToWhitelist: (domain, originalUrl) => ipcRenderer.send('add-to-whitelist', { domain, originalUrl }),
    onCreateNewTabForUrl: (callback) => ipcRenderer.on('create-new-tab-for-url', (_event, url) => callback(url)),
    popupAction: (action, text) => ipcRenderer.send('popup-action', { action, text }),
    showInputContextMenu: () => ipcRenderer.send('show-input-context-menu'),
    showContextMenu: (selection) => ipcRenderer.send('show-context-menu', selection),
    // Em preload.js, dentro do contextBridge
openSettings: () => ipcRenderer.send('open-settings-window'),
    // Note que a lógica de 'selectionchange' foi removida daqui.
     onTabUpdated: (callback) => ipcRenderer.on('tab-updated', (_event, data) => callback(data)),

    // ✅ LINHA A SER ADICIONADA ABAIXO
    // Dentro de preload.js, dentro de contextBridge.exposeInMainWorld('electronAPI', { ... })

    // ... (outras funções)
    addBookmark: (bookmark) => {
        // ✅ LOG ADICIONADO AQUI
        console.log('Preload: Passando favorito do renderer para o main.js.');
        ipcRenderer.send('add-bookmark', bookmark);
    },
    // ... (outras funções)

    menuItemClicked: (itemName) => ipcRenderer.send('menu-item-clicked', itemName),
    isBookmarked: (url) => ipcRenderer.invoke('is-bookmarked', url),
getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
clearBookmarks: () => ipcRenderer.send('clear-bookmarks'),
// DENTRO DE preload.js
onBookmarkUpdated: (callback) => ipcRenderer.on('bookmark-updated', (_event, data) => callback(data)),
 // ✅ LINHAS A SEREM ADICIONADAS
    removeBookmark: (url) => ipcRenderer.send('remove-bookmark', url),
    openLinkInNewTab: (url) => ipcRenderer.send('open-link-in-new-tab', url),
     // ✅ FUNÇÃO QUE FALTAVA PARA ABRIR O MENU
    openSettings: () => ipcRenderer.send('open-settings'),

    // Funções de favoritos
    addBookmark: (bookmark) => ipcRenderer.send('add-bookmark', bookmark),
    isBookmarked: (url) => ipcRenderer.invoke('is-bookmarked', url),
    onBookmarkUpdated: (callback) => ipcRenderer.on('bookmark-updated', (_event, data) => callback(data)),
    onCreateNewTabFromLibrary: (callback) => ipcRenderer.on('create-new-tab-from-library', (_event, url) => callback(url)),
    
openMainMenu: () => ipcRenderer.send('open-main-menu'),
});