// renderer.js - VERSÃO FINAL E CORRIGIDA

window.addEventListener('DOMContentLoaded', () => {
    // --- 1. Seleção de Elementos ---
    const tabsContainer = document.getElementById('tabs-container');
    const newTabBtn = document.getElementById('new-tab-btn');
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const urlInput = document.getElementById('url-input');
    const torToggleBtn = document.getElementById('tor-toggle-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const adblockToggleBtn = document.getElementById('adblock-toggle-btn');
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const splitViewBtn = document.getElementById('split-view-btn');

    // --- 2. Variáveis de Estado ---
    let tabs = new Map();
    let activeTabId = null;

    // --- 3. Funções de Gerenciamento de Abas ---
    function createNewTab(url) {
        const tabId = `tab-${Date.now()}`;
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-item';
        tabElement.dataset.tabId = tabId;
        tabElement.innerHTML = `<span class="tab-title">Carregando...</span><button class="close-tab-btn">×</button>`;
        
        tabsContainer.appendChild(tabElement);
        tabs.set(tabId, { element: tabElement, url: '', title: 'Nova Aba' });
        
        window.electronAPI.createTab(tabId, url);
        setActiveTab(tabId);
    }

    function setActiveTab(id) {
        if (activeTabId === id) return;
        if (activeTabId && tabs.has(activeTabId)) {
            tabs.get(activeTabId).element.classList.remove('active');
        }
        activeTabId = id;
        const tab = tabs.get(id);
        if (tab) {
            tab.element.classList.add('active');
            window.electronAPI.setActiveTab(id);
        }
    }

    function closeTab(tabId) {
        const tab = tabs.get(tabId);
        if (!tab) return;
        
        tab.element.remove();
        tabs.delete(tabId);
        window.electronAPI.closeTab(tabId);
        
        if (activeTabId === tabId) {
            const lastTabId = Array.from(tabs.keys()).pop();
            if (!lastTabId) {
                window.close();
            } else {
                setActiveTab(lastTabId);
            }
        }
    }

    // --- 4. Listeners de Eventos dos Botões da UI ---
    newTabBtn.addEventListener('click', () => createNewTab(null));
    backBtn.addEventListener('click', () => window.electronAPI.goBack());
    forwardBtn.addEventListener('click', () => window.electronAPI.goForward());
    reloadBtn.addEventListener('click', () => window.electronAPI.reload());
    settingsBtn.addEventListener('click', () => window.electronAPI.openSettingsWindow());
    torToggleBtn.addEventListener('click', () => window.electronAPI.toggleTor());
    adblockToggleBtn.addEventListener('click', () => window.electronAPI.toggleAdBlocker());

    sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('visible');
        window.electronAPI.toggleSidebar(sidebar.classList.contains('visible'));
    });

    splitViewBtn.addEventListener('click', () => {
        window.electronAPI.toggleSplitView();
    });

    addBookmarkBtn.addEventListener('click', () => {
        const activeTabData = tabs.get(activeTabId);
        if (activeTabData && activeTabData.url && !activeTabData.url.startsWith('file:')) {
            window.electronAPI.addBookmark({
                url: activeTabData.url,
                title: activeTabData.title,
                timestamp: Date.now()
            });
        }
    });
    
    urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const inputText = event.target.value.trim();
            if (!inputText) return;
            const isUrl = (inputText.includes('.') && !inputText.includes(' ')) || inputText.startsWith('http');
            const navigateUrl = isUrl ? (inputText.startsWith('http') ? inputText : 'https://' + inputText) : `https://www.google.com/search?q=${encodeURIComponent(inputText)}`;
            window.electronAPI.navigateTo(navigateUrl);
        }
    });
    
    urlInput.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        window.electronAPI.showInputContextMenu();
    });
    
    tabsContainer.addEventListener('click', (event) => {
        const tabElement = event.target.closest('.tab-item');
        if (!tabElement) return;
        const tabId = tabElement.dataset.tabId;
        if (event.target.classList.contains('close-tab-btn')) {
            closeTab(tabId);
        } else {
            setActiveTab(tabId);
        }
    });

    // --- 5. Listeners de Eventos vindos do Main Process ---
    window.electronAPI.onTabUpdated(async (data) => {
        const tab = tabs.get(data.id);
        if (tab) {
            tab.element.querySelector('.tab-title').textContent = data.title;
            tab.url = data.url;
            tab.title = data.title;

            if (data.id === activeTabId) {
                if (document.activeElement !== urlInput) {
                    urlInput.value = data.url.startsWith('file:') ? '' : data.url;
                }
                backBtn.disabled = !data.canGoBack;
                forwardBtn.disabled = !data.canGoForward;
                
                const isBookmarked = await window.electronAPI.isBookmarked(data.url);
                addBookmarkBtn.style.color = isBookmarked ? '#8ab4f8' : '';
            }
        }
    });

    window.electronAPI.onBookmarkUpdated(async ({ url }) => {
        const activeTabData = tabs.get(activeTabId);
        if (activeTabData && activeTabData.url === url) {
            const isBookmarked = await window.electronAPI.isBookmarked(url);
            addBookmarkBtn.style.color = isBookmarked ? '#8ab4f8' : '';
        }
    });

    window.electronAPI.onTorStatusChanged((isEnabled) => {
        torToggleBtn.classList.toggle('active', isEnabled);
        torToggleBtn.title = isEnabled ? 'Modo Anônimo (Tor) Ativado' : 'Ativar/Desativar Modo Anônimo (Tor)';
    });

    window.electronAPI.onAdBlockerStatusChanged((isEnabled) => {
        adblockToggleBtn.classList.toggle('active', isEnabled);
        adblockToggleBtn.title = isEnabled ? 'Bloqueador Ativado' : 'Bloqueador Desativado';
        window.electronAPI.reload();
    });

    window.electronAPI.onCreateNewTabForUrl((url) => {
        createNewTab(url);
    });

    window.electronAPI.onCreateNewTabFromLibrary((url) => {
        createNewTab(url);
    });

    // --- 6. Inicialização ---
    createNewTab(null);
});