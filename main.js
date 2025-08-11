// main.js - VERSÃO FINAL E COMPLETA PARA DEPURAÇÃO

const { app, BrowserWindow, ipcMain, BrowserView, session, dialog, Menu, clipboard } = require('electron');
const path = require('node:path');
let win;
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            // AQUI ESTÁ A CORREÇÃO: __dirname com dois sublinhados
            preload: path.join(__dirname, 'preload.js'),
            
            contextIsolation: true,
            nodeIntegration: false
        }
    });




const fs = require('node:fs');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const { execFile } = require('child_process');
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const nodeURL = require('node:url');// ✅ ADICIONE ESTA LINHA
const Store = require('electron-store');
const store = new Store();



// --- Variáveis Globais ---

const views = new Map();
let activeTabId = null;
const UI_HEIGHT = 73;
let isTorEnabled = false;
let sessionHistory = [];
let libraryWin = null;
let isAdBlockerEnabled = true;
let torProcess = null;
let blocker;
let popupWindow = null;
let defaultSession;
let torSession;
let settingsWin = null;
let bookmarks = store.get('bookmarks', []);

// --- Funções Auxiliares ---

function updateBounds() { if (!win || win.isDestroyed()) return; const { width, height } = win.getContentBounds(); const activeView = views.get(activeTabId); if (activeView) { activeView.setBounds({ x: 0, y: UI_HEIGHT, width: width, height: height - UI_HEIGHT }); } }
function setActiveTab(id) { if (!views.has(id)) return; activeTabId = id; const view = views.get(id); win.setTopBrowserView(view); updateBounds(); }
function addToHistory(view) { const url = view.webContents.getURL(); const title = view.webContents.getTitle(); if (!url.startsWith('file://') && title && (sessionHistory.length === 0 || sessionHistory[sessionHistory.length - 1].url !== url)) { sessionHistory.push({ url, title, timestamp: `${Date.now()}` }); } }
function enableBlocker(blockerInstance, sessionToEnable) { try { blockerInstance.enableBlockingInSession(sessionToEnable); } catch (error) { if (!error.message.includes('Attempted to register a second handler')) { console.error('Erro inesperado ao ativar o bloqueador:', error); throw error; } } }
function startTorProcess() { try { const torPath = path.join(app.getAppPath(), 'tor', process.platform === 'win32' ? 'tor.exe' : 'tor'); torProcess = execFile(torPath); console.log('Processo Tor iniciado.'); } catch (error) { console.error('Falha ao iniciar o Tor. Verifique o caminho e as permissões.', error); } }
async function configureTorSession() { try { await torSession.setProxy({ proxyRules: 'socks5://127.0.0.1:9050' }); console.log('Sessão Tor configurada com proxy.'); } catch (error) { console.error('Erro ao configurar a sessão Tor:', error); } }
function readSettings() {
    try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch (error) {
        return {}; // Retorna objeto vazio se o arquivo não existir ou for inválido
    }
}
// Dentro de main.js

function createMenuWindow(parentWebContents) {
    // ... (o seu código que cria a menuWindow)
    const menuWindow = new BrowserWindow({
        // ... (as suas opções: x, y, width, height, etc.)
    });

    menuWindow.loadFile(path.join(__dirname, 'src/menu.html'));

    // ✅ ADICIONE ESTA LINHA TEMPORARIAMENTE PARA DEPURAÇÃO
    menuWindow.webContents.openDevTools({ mode: 'detach' });

    // ... (o resto da função)
}



// --- Bloco Principal de Inicialização ---
app.whenReady().then(async () => {
    defaultSession = session.fromPartition('persist:default');
    torSession = session.fromPartition('persist:tor');
    startTorProcess();
    await configureTorSession();
    const enginePath = path.join(__dirname, 'adblocker-engine.bin');
    if (fs.existsSync(enginePath)) { try { blocker = ElectronBlocker.deserialize(fs.readFileSync(enginePath)); console.log('Motor de bloqueio profissional carregado.'); enableBlocker(blocker, defaultSession); enableBlocker(blocker, torSession); } catch (error) { console.error('Falha crítica ao carregar o motor de bloqueio:', error); blocker = null; } } else { console.error('Ficheiro `adblocker-engine.bin` não encontrado.'); isAdBlockerEnabled = false; }
    defaultSession.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
    torSession.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
    win = new BrowserWindow({ backgroundColor: '#202324', width: 1200, height: 800, webPreferences: { preload: path.join(__dirname, 'preload.js'), } });
    win.webContents.on('did-finish-load', () => { win.webContents.send('adblocker-status-changed', isAdBlockerEnabled); win.webContents.send('tor-status-changed', isTorEnabled); });
    win.removeMenu();
    win.loadFile('src/index.html');
    win.on('resize', updateBounds);
});

// --- Listeners de Eventos do App e IPC ---
app.on('will-quit', () => { torProcess?.kill(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// main.js -> Substitua esta função inteira

ipcMain.on('create-tab', (event, id, url) => { // O parâmetro aqui pode continuar se chamando 'url'
    const activeSession = isTorEnabled ? torSession : defaultSession;

const view = new BrowserView({
    // ✅ A CORREÇÃO ESTÁ AQUI
    backgroundColor: '#202324', 

    webPreferences: {
        preload: path.join(__dirname, 'preload-view.js'), 
        sandbox: false, 
        session: activeSession,
    }
});

    win.addBrowserView(view);
    views.set(id, view);
    
    // (O resto da configuração da view, como 'updateTabData', etc., continua igual)
    const updateTabData = () => { if (win && !win.isDestroyed()) { win.webContents.send('tab-updated', { id, title: view.webContents.getTitle(), url: view.webContents.getURL(), canGoBack: view.webContents.navigationHistory.canGoBack(), canGoForward: view.webContents.navigationHistory.canGoForward() }); } };
    view.webContents.on('page-title-updated', updateTabData);
    view.webContents.on('did-navigate', () => { addToHistory(view); updateTabData(); });
    view.webContents.on('did-finish-load', updateBounds);

    if (url) {
        view.webContents.loadURL(url);
    } else {
        const settings = readSettings();
        const cssPath = path.join(__dirname, 'src', 'css', 'start.css');
        const jsPath = path.join(__dirname, 'src', 'js', 'start.js');

        view.webContents.loadFile(
            path.join(__dirname, 'src', 'start.html'),
            { 
                query: { 
                    bg: settings ? settings.backgroundImage : null,
                    // ✅ CORREÇÃO: Usando o nome 'nodeURL' sem conflito
                    css: nodeURL.pathToFileURL(cssPath).href,
                    js: nodeURL.pathToFileURL(jsPath).href
                } 
            }
        );
    }

    setActiveTab(id);
});




ipcMain.on('toggle-tor', async (event) => { isTorEnabled = !isTorEnabled; dialog.showMessageBox(win, { type: 'info', title: `Modo Anônimo ${isTorEnabled ? 'Ativado' : 'Desativado'}`, message: `O modo anônimo foi ${isTorEnabled ? 'ATIVADO' : 'DESATIVADO'}.\n\nNovas abas usarão a ${isTorEnabled ? 'rede Tor' : 'conexão normal'}.\nAbas existentes não serão afetadas.` }); if (win && !win.isDestroyed()) { win.webContents.send('tor-status-changed', isTorEnabled); } });
ipcMain.on('toggle-adblocker', () => { if (!blocker) { console.log('Motor de bloqueio não está disponível.'); return; } isAdBlockerEnabled = !isAdBlockerEnabled; if (isAdBlockerEnabled) { enableBlocker(blocker, defaultSession); enableBlocker(blocker, torSession); console.log('Bloqueador reativado.'); } else { blocker.disableBlockingInSession(defaultSession); blocker.disableBlockingInSession(torSession); console.log('Bloqueador desativado.'); } if (win && !win.isDestroyed()) { win.webContents.send('adblocker-status-changed', isAdBlockerEnabled); } });
ipcMain.on('set-active-tab', (event, id) => setActiveTab(id));
ipcMain.on('close-tab', (event, id) => { const view = views.get(id); if (view) { win.removeBrowserView(view); view.webContents.destroy(); views.delete(id); if (activeTabId === id) activeTabId = null; } });
ipcMain.on('navigate-to', (event, url) => views.get(activeTabId)?.webContents.loadURL(url));
ipcMain.on('go-back', () => views.get(activeTabId)?.webContents.goBack());
ipcMain.on('go-forward', () => views.get(activeTabId)?.webContents.goForward());
ipcMain.on('reload', () => views.get(activeTabId)?.webContents.reload());
ipcMain.on('menu-item-clicked', (event, itemName) => { if (itemName === 'history' || itemName === 'downloads') { if (libraryWin) { libraryWin.focus(); return; } libraryWin = new BrowserWindow({ width: 800, height: 600, parent: win, webPreferences: { preload: path.join(__dirname, 'preload.js') } }); libraryWin.removeMenu(); libraryWin.loadFile('src/library.html'); libraryWin.on('closed', () => { libraryWin = null; }); } });
ipcMain.handle('get-history', () => sessionHistory.slice().reverse());
ipcMain.on('clear-history', () => { sessionHistory = []; });


// DENTRO DE main.js

// ✅ ESTE É O BLOCO QUE FALTAVA PARA ABRIR O MENU
ipcMain.on('open-settings', (event) => {
    // Posição do botão para abrir o menu perto dele (isto é um exemplo, podemos ajustar)
    const [winX, winY] = win.getPosition();
    const menuWidth = 240;
    const menuHeight = 200;

    const menuWindow = new BrowserWindow({
        x: winX + 500, // Ajuste a posição conforme necessário
        y: winY + 60,  // Ajuste a posição conforme necessário
        width: menuWidth,
        height: menuHeight,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        show: false, // Começa escondido para evitar piscar
        webPreferences: {
            preload: path.join(__dirname, 'preload-popup.js') // Usa o preload do popup
        }
    });

    menuWindow.loadFile(path.join(__dirname, 'src/menu.html'));

    // Abre as ferramentas de depuração para vermos os logs do menu
    menuWindow.webContents.openDevTools({ mode: 'detach' });

    // Mostra a janela quando estiver pronta
    menuWindow.once('ready-to-show', () => {
        menuWindow.show();
    });

    // Fecha o menu se ele perder o foco
    menuWindow.on('blur', () => {
        if (!menuWindow.isDestroyed()) {
            menuWindow.close();
        }
    });
});

// Dentro de main.js

// ✅ BLOCO 1 A SER ADICIONADO
// Listener para remover um único favorito
ipcMain.on('remove-bookmark', (event, url) => {
    // Filtra a lista, mantendo todos os favoritos exceto o que foi removido
    bookmarks = bookmarks.filter(b => b.url !== url);
    store.set('bookmarks', bookmarks); // Atualiza os dados guardados
});


// ✅ BLOCO 2 A SER ADICIONADO
// Listener para abrir um link da biblioteca numa nova aba na janela principal
ipcMain.on('open-link-in-new-tab', (event, url) => {
    // Encontra a janela principal
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.getParentWindow());
    if (mainWindow) {
        // Envia uma mensagem para o renderer da janela principal para criar a aba
        mainWindow.webContents.send('create-new-tab-from-library', url);
        mainWindow.focus(); // Traz a janela principal para a frente
    }
});

// Dentro de main.js

// ✅ ADICIONE ESTE BLOCO DE CÓDIGO
// Listener para as ações vindas do menu dropdown
// DENTRO DE main.js

// ESTE BLOCO PROCESSA OS CLIQUES DENTRO DO MENU
ipcMain.on('menu-action', (event, action) => {
    console.log(`MAIN.JS: Ação "${action}" recebida do menu!`);

    const menuWindow = BrowserWindow.fromWebContents(event.sender);
    if (menuWindow) menuWindow.close();

    const mainWindow = win; // Nossa janela principal

    switch (action) {
        case 'library':
            // Você já tem uma lógica para abrir a biblioteca, vamos adaptá-la
            if (libraryWin && !libraryWin.isDestroyed()) {
                libraryWin.focus();
                return;
            }
            libraryWin = new BrowserWindow({ width: 800, height: 600, parent: win, webPreferences: { preload: path.join(__dirname, 'preload.js') } });
            libraryWin.removeMenu();
            libraryWin.loadFile('src/library.html');
            libraryWin.on('closed', () => { libraryWin = null; });
            break;
        case 'settings':
            // E também para as configurações
            if (settingsWin && !settingsWin.isDestroyed()) {
                settingsWin.focus();
                return;
            }
            settingsWin = new BrowserWindow({ width: 600, height: 400, parent: win, webPreferences: { preload: path.join(__dirname, 'preload-settings.js') } });
            settingsWin.removeMenu();
            settingsWin.loadFile('src/settings.html');
            settingsWin.on('closed', () => { settingsWin = null; });
            break;
        case 'devtools':
            if (mainWindow) mainWindow.webContents.toggleDevTools();
            break;
        case 'exit':
            app.quit();
            break;
    }
});

ipcMain.on('add-bookmark', (event, bookmark) => {
    // Encontra o favorito na lista
    const existingIndex = bookmarks.findIndex(b => b.url === bookmark.url);

    if (existingIndex > -1) {
        // Se já existe, remove (efeito de desfavoritar)
        bookmarks.splice(existingIndex, 1);
    } else {
        // Se não existe, adiciona no início da lista
        bookmarks.unshift(bookmark);
    }
    // Guarda a lista atualizada no disco
    store.set('bookmarks', bookmarks);

    // Notifica a janela principal para que ela possa atualizar a cor do botão
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.webContents.send('bookmark-updated', { url: bookmark.url });
    }
});



// 4. Adicione um handler para o renderer poder verificar se uma URL é favorita
ipcMain.handle('is-bookmarked', (event, url) => {
    return bookmarks.some(b => b.url === url);
});


// 5. Adicione um handler para a página da biblioteca poder pedir a lista de favoritos
ipcMain.handle('get-bookmarks', () => {
    return store.get('bookmarks', []);
});

// 6. Adicione um handler para limpar todos os favoritos
ipcMain.on('clear-bookmarks', () => {
    bookmarks = [];
    store.set('bookmarks', []);
});

ipcMain.on('remove-bg-image', (event) => {
    try {
        const settings = readSettings();
        settings.backgroundImage = null; // Remove imagem
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

        // Avisa a janela de configurações que foi removido
        event.sender.send('bg-selected', null);
    } catch (err) {
        console.error('Erro ao remover imagem de fundo:', err);
    }
});


ipcMain.on('open-bg-dialog', (event) => {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Imagens', extensions: ['jpg', 'png', 'gif'] }]
    }).then(result => {
        if (!result.canceled) {
            const imagePath = result.filePaths[0];
            const settings = readSettings();
            settings.backgroundImage = imagePath;
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

            // Avisa a janela de configurações sobre a seleção
            event.sender.send('bg-selected', imagePath);
        }
    }).catch(err => {
        console.log(err);
    });
});

ipcMain.on('open-settings-window', () => {
    if (settingsWin) {
        settingsWin.focus();
        return;
    }
    settingsWin = new BrowserWindow({
        width: 600, height: 400,
        parent: win,
        autoHideMenuBar: true,
        webPreferences: {
            // Vamos criar um preload para as configurações também
            preload: path.join(__dirname, 'preload-settings.js'),
            sandbox: false // Necessário se você usar APIs do Node no preload
        }
    });
    settingsWin.loadFile('src/settings.html');
    settingsWin.on('closed', () => { settingsWin = null; });
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