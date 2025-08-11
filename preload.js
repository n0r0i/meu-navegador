// preload.js - VERSÃO CORRIGIDA E LIMPA

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // --- Navegação e Abas ---
    createTab: (id, url) => ipcRenderer.send('create-tab', id, url),
    setActiveTab: (id) => ipcRenderer.send('set-active-tab', id),
    closeTab: (id) => ipcRenderer.send('close-tab', id),
    navigateTo: (url) => ipcRenderer.send('navigate-to', url),
    goBack: () => ipcRenderer.send('go-back'),
    goForward: () => ipcRenderer.send('go-forward'),
    reload: () => ipcRenderer.send('reload'),
    onTabUpdated: (callback) => ipcRenderer.on('tab-updated', (_event, data) => callback(data)),
    onCreateNewTabForUrl: (callback) => ipcRenderer.on('create-new-tab-for-url', (_event, url) => callback(url)),
    onCreateNewTabFromLibrary: (callback) => ipcRenderer.on('create-new-tab-from-library', (_event, url) => callback(url)),

    // --- Histórico ---
    getHistory: () => ipcRenderer.invoke('get-history'),
    clearHistory: () => ipcRenderer.send('clear-history'),
    deleteHistoryItem: (timestamp) => ipcRenderer.send('delete-history-item', timestamp),

    // --- Favoritos ---
    addBookmark: (bookmark) => ipcRenderer.send('add-bookmark', bookmark),
    isBookmarked: (url) => ipcRenderer.invoke('is-bookmarked', url),
    onBookmarkUpdated: (callback) => ipcRenderer.on('bookmark-updated', (_event, data) => callback(data)),
    getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
    clearBookmarks: () => ipcRenderer.send('clear-bookmarks'),
    removeBookmark: (url) => ipcRenderer.send('remove-bookmark', url),
    openLinkInNewTab: (url) => ipcRenderer.send('open-link-in-new-tab', url),

    // --- Funcionalidades (Tor, Adblocker, Menus) ---
    toggleTor: () => ipcRenderer.send('toggle-tor'),
    onTorStatusChanged: (callback) => ipcRenderer.on('tor-status-changed', (_event, isEnabled) => callback(isEnabled)),
    toggleAdBlocker: () => ipcRenderer.send('toggle-adblocker'),
    onAdBlockerStatusChanged: (callback) => ipcRenderer.on('adblocker-status-changed', (_event, isEnabled) => callback(isEnabled)),
    openSettingsWindow: () => ipcRenderer.send('open-settings-window'),
    showInputContextMenu: () => ipcRenderer.send('show-input-context-menu'),
    showContextMenu: (selection) => ipcRenderer.send('show-context-menu', selection),
    popupAction: (action, text) => ipcRenderer.send('popup-action', { action, text }),
});