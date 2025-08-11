const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Abas e Navegação
    createTab: (id, url) => ipcRenderer.send('create-tab', id, url),
    setActiveTab: (id) => ipcRenderer.send('set-active-tab', id),
    closeTab: (id) => ipcRenderer.send('close-tab', id),
    navigateTo: (url) => ipcRenderer.send('navigate-to', url),
    goBack: () => ipcRenderer.send('go-back'),
    goForward: () => ipcRenderer.send('go-forward'),
    reload: () => ipcRenderer.send('reload'),
    onTabUpdated: (callback) => ipcRenderer.on('tab-updated', (_event, data) => callback(data)),

    // Menu Principal
    openMainMenu: () => ipcRenderer.send('open-main-menu'),

    // Favoritos
    addBookmark: (bookmark) => ipcRenderer.send('add-bookmark', bookmark),
    isBookmarked: (url) => ipcRenderer.invoke('is-bookmarked', url),
    onBookmarkUpdated: (callback) => ipcRenderer.on('bookmark-updated', (_event, data) => callback(data)),

    // Biblioteca
    openLinkInNewTab: (url) => ipcRenderer.send('open-link-in-new-tab', url),
    onCreateNewTabFromLibrary: (callback) => ipcRenderer.on('create-new-tab-from-library', (_event, url) => callback(url)),
    
    // Toggles (Tor, AdBlock)
    toggleTor: () => ipcRenderer.send('toggle-tor'),
    onTorStatusChanged: (callback) => ipcRenderer.on('tor-status-changed', (_event, isEnabled) => callback(isEnabled)),
    toggleAdBlocker: () => ipcRenderer.send('toggle-adblocker'),
    onAdBlockerStatusChanged: (callback) => ipcRenderer.on('adblocker-status-changed', (_event, isEnabled) => callback(isEnabled)),
});