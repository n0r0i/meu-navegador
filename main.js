// main.js - VERSÃO FINAL COM AVISOS CORRIGIDOS

const { app, BrowserWindow, ipcMain, BrowserView, session, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const { execFile } = require('child_process');
const Store = require('electron-store');

// Variáveis
const store = new Store();
let win;
const views = new Map();
let activeTabId = null;
const UI_HEIGHT = 73;
let isTorEnabled = false;
let sessionHistory = store.get('history', []);
let libraryWin = null;
let settingsWin = null;
let isAdBlockerEnabled = true;
let torProcess = null;
let blocker;
let defaultSession;
let torSession;
let bookmarks = store.get('bookmarks', []);
let isAdBlockerEnabled = store.get('adblocker_is_enabled', true); 

// Funções de Janelas
function createLibraryWindow() {
    if (libraryWin && !libraryWin.isDestroyed()) { libraryWin.focus(); return; }
    libraryWin = new BrowserWindow({ width: 800, height: 600, parent: win, webPreferences: { preload: path.join(__dirname, 'preload.js') } });
    libraryWin.removeMenu();
    libraryWin.loadFile('src/library.html');
    libraryWin.on('closed', () => { libraryWin = null; });
}

function createSettingsWindow() {
    if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.focus(); return; }
    settingsWin = new BrowserWindow({ width: 600, height: 400, parent: win, webPreferences: { preload: path.join(__dirname, 'preload-settings.js') } });
    settingsWin.removeMenu();
    settingsWin.loadFile('src/settings.html');
    settingsWin.on('closed', () => { settingsWin = null; });
}

// Funções Auxiliares
function updateBounds() { if (!win || win.isDestroyed()) return; const { width, height } = win.getContentBounds(); const activeView = views.get(activeTabId); if (activeView) activeView.setBounds({ x: 0, y: UI_HEIGHT, width, height: height - UI_HEIGHT }); }
function setActiveTab(id) { if (!views.has(id)) return; activeTabId = id; const view = views.get(id); win.setTopBrowserView(view); updateBounds(); }
function addToHistory(view) { const url = view.webContents.getURL(); const title = view.webContents.getTitle(); if (!url.startsWith('file://') && title && (sessionHistory.length === 0 || sessionHistory[0].url !== url)) { sessionHistory.unshift({ url, title, timestamp: Date.now() }); store.set('history', sessionHistory); } }
function startTorProcess() { try { const torPath = path.join(app.getAppPath(), 'tor', process.platform === 'win32' ? 'tor.exe' : 'tor'); torProcess = execFile(torPath); } catch (e) { console.error('Falha ao iniciar Tor', e); } }
async function configureTorSession() { try { await torSession.setProxy({ proxyRules: 'socks5://127.0.0.1:9050' }); } catch (e) { console.error('Erro ao configurar proxy Tor', e); } }

function enableBlocker(sessionToEnable) {
    if (blocker) {
        try { blocker.enableBlockingInSession(sessionToEnable); } 
        catch (err) { console.log('Aviso AdBlocker:', err.message); }
    }
}
function disableBlocker(sessionToDisable) {
    if (blocker) {
        try { blocker.disableBlockingInSession(sessionToDisable); } 
        catch (err) { console.error('Erro ao desativar bloqueador:', err.message); }
    }
}

// Início da Aplicação
app.whenReady().then(async () => {
    defaultSession = session.fromPartition('persist:default');
    torSession = session.fromPartition('persist:tor');
    startTorProcess();
    await configureTorSession();
    
    try {
        const enginePath = path.join(__dirname, 'adblocker-engine.bin');
            if (isAdBlockerEnabled) {
                enableBlocker(defaultSession);
                enableBlocker(torSession);
            }
        } else { 
            console.log('Ficheiro adblocker-engine.bin não encontrado. O AdBlocker está desativado.');
            isAdBlockerEnabled = false; 
        }
    } catch (e) { 
        console.error('Falha ao carregar AdBlocker', e); 
        isAdBlockerEnabled = false; 
    }
    
    win = new BrowserWindow({ backgroundColor: '#202324', width: 1200, height: 800, webPreferences: { preload: path.join(__dirname, 'preload.js') } });
    win.removeMenu();
    win.loadFile('src/index.html');
    win.on('resize', updateBounds);
    win.webContents.on('did-finish-load', () => {
        // Envia o estado inicial dos botões para a interface
        win.webContents.send('adblocker-status-changed', isAdBlockerEnabled);
        win.webContents.send('tor-status-changed', isTorEnabled);
    });
});

app.on('will-quit', () => torProcess?.kill());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

app.on('will-quit', () => torProcess?.kill());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// IPC Listeners
ipcMain.on('create-tab', (event, id, url) => {
    const activeSession = isTorEnabled ? torSession : defaultSession;
    const view = new BrowserView({ backgroundColor: '#FFFFFF', webPreferences: { preload: path.join(__dirname, 'preload-view.js'), sandbox: false, session: activeSession } });
    win.addBrowserView(view);
    views.set(id, view);
    
    // ✅ CORREÇÃO DOS AVISOS DE DEPRECATION
    const update = () => {
        if (!win.isDestroyed()) {
            win.webContents.send('tab-updated', {
                id,
                title: view.webContents.getTitle(),
                url: view.webContents.getURL(),
                canGoBack: view.webContents.navigationHistory.canGoBack(),
                canGoForward: view.webContents.navigationHistory.canGoForward()
            });
        }
    };
    
    view.webContents.on('page-title-updated', update);
    view.webContents.on('did-navigate', () => { addToHistory(view); update(); });
    view.webContents.loadURL(url || 'file://' + path.join(__dirname, 'src/start.html'));
    setActiveTab(id);
});

ipcMain.on('set-active-tab', (event, id) => setActiveTab(id));
ipcMain.on('close-tab', (event, id) => { const view = views.get(id); if (view) { win.removeBrowserView(view); view.webContents.destroy(); views.delete(id); if (activeTabId === id) activeTabId = null; } });
ipcMain.on('navigate-to', (event, url) => views.get(activeTabId)?.webContents.loadURL(url));
ipcMain.on('go-back', () => views.get(activeTabId)?.webContents.goBack());
ipcMain.on('go-forward', () => views.get(activeTabId)?.webContents.goForward());
ipcMain.on('reload', () => views.get(activeTabId)?.webContents.reload());

ipcMain.on('toggle-tor', () => { isTorEnabled = !isTorEnabled; win.webContents.send('tor-status-changed', isTorEnabled); dialog.showMessageBox(win, { type: 'info', title: `Modo Anônimo`, message: `O Modo Anônimo (Tor) foi ${isTorEnabled ? 'ATIVADO' : 'DESATIVADO'}. Novas abas usarão a rede correspondente.` }); });
ipcMain.on('toggle-adblocker', () => { if (!blocker) { console.error('AdBlocker não está disponível.'); return; } isAdBlockerEnabled = !isAdBlockerEnabled; if(isAdBlockerEnabled) { enableBlocker(defaultSession); enableBlocker(torSession); } else { disableBlocker(defaultSession); disableBlocker(torSession); } win.webContents.send('adblocker-status-changed', isAdBlockerEnabled); });

ipcMain.handle('get-history', () => store.get('history', []));
ipcMain.on('clear-history', () => { sessionHistory = []; store.set('history', []); });
ipcMain.on('add-bookmark', (event, bookmark) => { const existingIndex = bookmarks.findIndex(b => b.url === bookmark.url); if (existingIndex > -1) bookmarks.splice(existingIndex, 1); else bookmarks.unshift(bookmark); store.set('bookmarks', bookmarks); win.webContents.send('bookmark-updated', { url: bookmark.url }); });
ipcMain.handle('is-bookmarked', (event, url) => bookmarks.some(b => b.url === url));
ipcMain.handle('get-bookmarks', () => store.get('bookmarks', []));
ipcMain.on('clear-bookmarks', () => { bookmarks = []; store.set('bookmarks', []); });
ipcMain.on('remove-bookmark', (event, url) => { bookmarks = bookmarks.filter(b => b.url !== url); store.set('bookmarks', bookmarks); });
ipcMain.on('open-link-in-new-tab', (event, url) => { if (win) { win.webContents.send('create-new-tab-from-library', url); win.focus(); } });

ipcMain.on('open-main-menu', (event) => {
    const [winX, winY] = win.getPosition();
    const menuWindow = new BrowserWindow({ x: winX + 700, y: winY + 60, width: 240, height: 200, frame: false, transparent: true, alwaysOnTop: true, resizable: false, show: false, webPreferences: { preload: path.join(__dirname, 'preload-popup.js') } });
    menuWindow.loadFile(path.join(__dirname, 'src/menu.html'));
    menuWindow.once('ready-to-show', () => menuWindow.show());
    menuWindow.on('blur', () => { if (!menuWindow.isDestroyed()) menuWindow.close(); });
});

ipcMain.on('menu-action', (event, action) => {
    const menuWindow = BrowserWindow.fromWebContents(event.sender);
    if (menuWindow) menuWindow.close();
    switch (action) {
        case 'library': createLibraryWindow(); break;
        case 'settings': createSettingsWindow(); break;
        case 'devtools': if (win) win.webContents.toggleDevTools(); break;
        case 'exit': app.quit(); break;
    }
});

// Listener antigo que agora apenas chama a função correta
// ESTA ERA A LINHA EM FALTA
ipcMain.on('open-settings-window', () => {
    createSettingsWindow();
});

ipcMain.on('navigate-current-tab', (event, url) => {
    // Pega a BrowserView da aba que está ativa no momento
    const activeView = views.get(activeTabId);
    if (activeView) {
        // Manda ela navegar para a nova URL
        activeView.webContents.loadURL(url);
    }
});
// --- HANDLERS PARA POP-UP E MENU DE CONTEXTO ---

ipcMain.on('popup-action', (event, { action, text }) => {
    console.log(`--- Main.js recebeu popup-action: ${action} ---`); // LOG 12
    if (action === 'copy') { clipboard.writeText(text); } else { let url; if (action === 'search') { url = `https://www.google.com/search?q=${encodeURIComponent(text)}`; } else if (action === 'translate') { url = `https://translate.google.com/?sl=auto&tl=pt&text=${encodeURIComponent(text)}`; } if (url) { win.webContents.send('create-new-tab-for-url', url); } } if (popupWindow && !popupWindow.isDestroyed()) { popupWindow.close(); } popupWindow = null; });

ipcMain.on('show-context-menu', (event, selectedText) => {
    console.log("--- Main.js recebeu 'show-context-menu' ---"); // LOG 10
    const template = []; if (selectedText.length > 0) { template.push({ label: 'Copiar', role: 'copy', }, { label: `Pesquisar "${selectedText.substring(0, 20)}..."`, click: () => { const url = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`; win.webContents.send('create-new-tab-for-url', url); } }, { type: 'separator' }); } template.push({ label: 'Voltar', enabled: views.get(activeTabId)?.webContents.canGoBack(), click: () => views.get(activeTabId)?.webContents.goBack() }, { label: 'Avançar', enabled: views.get(activeTabId)?.webContents.canGoForward(), click: () => views.get(activeTabId)?.webContents.goForward() },     { 
        label: 'Recarregar', 
        click: () => {
            // ✅ CORREÇÃO: Pega a aba ativa e recarrega apenas ela
            const activeView = views.get(activeTabId);
            if (activeView) {
                activeView.webContents.reload();
            }
        } 
    }, { label: 'Imprimir...', click: () => views.get(activeTabId)?.webContents.print() }, { 
    label: 'Inspecionar elemento', 
    click: () => {
        // ✅ CORREÇÃO: Abre as DevTools em uma janela separada (undocked)
        const activeView = views.get(activeTabId);
        if (activeView) {
            activeView.webContents.openDevTools({ mode: 'undocked' });
        }
    } 
}); const menu = Menu.buildFromTemplate(template); menu.popup({ window: win }); });

ipcMain.on('show-selection-popup', (event, { text, rect }) => {
    console.log("--- Main.js recebeu 'show-selection-popup' ---"); // LOG 11
    if (!win || win.isDestroyed()) { return; } if (popupWindow) popupWindow.close(); const mainBounds = win.getBounds(); const view = views.get(activeTabId); if (!view || view.webContents.isDestroyed()) { return; } const viewBounds = view.getBounds(); const popupHeight = 55; const popupWidth = 260; popupWindow = new BrowserWindow({ x: mainBounds.x + viewBounds.x + rect.x, y: mainBounds.y + viewBounds.y + rect.y - popupHeight - 5, width: popupWidth, height: popupHeight, frame: false, transparent: true, alwaysOnTop: true, resizable: false, movable: false, show: false, webPreferences: { preload: path.join(__dirname, 'preload-popup.js'), session: defaultSession, devTools: false } }); const urlParams = new URLSearchParams({ text }).toString(); popupWindow.loadFile(path.join(__dirname, 'src/popup.html'), { search: urlParams }); popupWindow.once('ready-to-show', () => { if (popupWindow && !popupWindow.isDestroyed()) { popupWindow.show(); } }); popupWindow.on('blur', () => { if (popupWindow && !popupWindow.isDestroyed()) { popupWindow.close(); } popupWindow = null; }); });

ipcMain.on('hide-selection-popup', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
        popupWindow.close();
    }
});

ipcMain.on('show-input-context-menu', (event) => {
    const template = [
        { role: 'undo' , label: 'Desfazer' },
        { role: 'redo' , label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut' , label: 'Recortar' },
        { role: 'copy' , label: 'Copiar' },
        { role: 'paste' , label: 'Colar' },
        { type: 'separator' },
        { role: 'selectAll' , label: 'Selecionar tudo' }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: win });
});

ipcMain.on('show-selection-popup', (event, { text, rect }) => {    if (!win || win.isDestroyed()) {        return;     }
    // Fecha qualquer pop-up antigo antes de criar um novo
    if (popupWindow) popupWindow.close();    const mainBounds = win.getBounds();     const view = views.get(activeTabId);    if (!view || view.webContents.isDestroyed()) {        return;    }    const viewBounds = view.getBounds();

    // ✅ NOVAS DIMENSÕES E CÁLCULO DE POSIÇÃO
    const popupHeight = 55;    const popupWidth = 260;    popupWindow = new BrowserWindow({
        x: mainBounds.x + viewBounds.x + rect.x,
        y: mainBounds.y + viewBounds.y + rect.y - popupHeight - 5, // 5px de margem acima
        width: popupWidth,
        height: popupHeight,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        movable: false,
        show: false,
        webPreferences: { 
            preload: path.join(__dirname, 'preload-popup.js'),
            session: defaultSession,
            devTools: false // Desativa devTools para o pop-up
        }
    });

    const urlParams = new URLSearchParams({ text }).toString();
    popupWindow.loadFile(path.join(__dirname, 'src/popup.html'), { search: urlParams });
    
    popupWindow.once('ready-to-show', () => {
        if (popupWindow && !popupWindow.isDestroyed()) {
            popupWindow.show();
        }
    });

    // Listener para fechar o pop-up quando ele perde o foco
    popupWindow.on('blur', () => {
        if (popupWindow && !popupWindow.isDestroyed()) {
            popupWindow.close();
        }
        popupWindow = null;
    });
});