document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleção de Elementos
    const tabsContainer = document.getElementById('tabs-container');
    const newTabBtn = document.getElementById('new-tab-btn');
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const urlInput = document.getElementById('url-input');
    const torToggleBtn = document.getElementById('tor-toggle-btn');
    const adblockToggleBtn = document.getElementById('adblock-toggle-btn');
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const settingsBtn = document.getElementById('settings-btn');

    // 2. Estado
    let tabs = new Map();
    let activeTabId = null;

    // 3. Funções de Gestão de Abas
    function createNewTab(url = null, makeActive = true) {
        const tabId = `tab-${Date.now()}`;
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-item';
        tabElement.dataset.tabId = tabId;
        tabElement.innerHTML = `<img class="tab-icon" src="icon.png"><span class="tab-title">Carregando...</span><button class="close-tab-btn">×</button>`;
        tabsContainer.appendChild(tabElement);

        tabs.set(tabId, { element: tabElement, url: url, title: 'Nova Aba' });
        window.electronAPI.createTab(tabId, url);

        if (makeActive) setActiveTab(tabId);

        tabElement.addEventListener('click', () => setActiveTab(tabId));
        tabElement.querySelector('.close-tab-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tabId);
        });
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
            lastTabId ? setActiveTab(lastTabId) : createNewTab();
        }
    }

    // 4. Listeners dos Botões
    newTabBtn.addEventListener('click', () => createNewTab());
    backBtn.addEventListener('click', () => window.electronAPI.goBack());
    forwardBtn.addEventListener('click', () => window.electronAPI.goForward());
    reloadBtn.addEventListener('click', () => window.electronAPI.reload());
    settingsBtn.addEventListener('click', () => window.electronAPI.openMainMenu());
    torToggleBtn.addEventListener('click', () => window.electronAPI.toggleTor());
    adblockToggleBtn.addEventListener('click', () => window.electronAPI.toggleAdBlocker());

    addBookmarkBtn.addEventListener('click', () => {
        const activeTab = tabs.get(activeTabId);
        if (activeTab && activeTab.url && !activeTab.url.startsWith('file:')) {
            window.electronAPI.addBookmark({ url: activeTab.url, title: activeTab.title });
        }
    });

    urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const url = urlInput.value.trim();
            if (url) {
                const isUrl = (url.includes('.') && !url.includes(' ')) || url.startsWith('http');
                const navigateUrl = isUrl ? (url.startsWith('http') ? url : 'https://' + url) : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
                window.electronAPI.navigateTo(navigateUrl);
            }
        }
    });
    
    // 5. Listeners de Eventos do Main Process
    window.electronAPI.onTabUpdated(async ({ id, title, url, canGoBack, canGoForward }) => {
        const tab = tabs.get(id);
        if (!tab) return;
        
        tab.url = url;
        tab.title = title;
        tab.element.querySelector('.tab-title').textContent = title || 'Carregando...';
        tab.element.querySelector('.tab-icon').src = url.startsWith('file://') ? 'icon.png' : `https://www.google.com/s2/favicons?sz=16&domain_url=${url}`;
        
        if (id === activeTabId) {
            urlInput.value = url.startsWith('file://') ? '' : url;
            backBtn.disabled = !canGoBack;
            forwardBtn.disabled = !canGoForward;
            
            if (!url.startsWith('file://')) {
                const isBookmarked = await window.electronAPI.isBookmarked(url);
                addBookmarkBtn.style.color = isBookmarked ? '#8ab4f8' : '#fff';
            } else {
                addBookmarkBtn.style.color = '#fff';
            }
        }
    });

    window.electronAPI.onCreateNewTabFromLibrary((url) => createNewTab(url, true));

    window.electronAPI.onBookmarkUpdated(async () => {
        const activeTab = tabs.get(activeTabId);
        if (activeTab && !activeTab.url.startsWith('file://')) {
            const isBookmarked = await window.electronAPI.isBookmarked(activeTab.url);
            addBookmarkBtn.style.color = isBookmarked ? '#8ab4f8' : '#fff';
        }
    });

    window.electronAPI.onTorStatusChanged((isEnabled) => {
        torToggleBtn.style.color = isEnabled ? '#8ab4f8' : '#fff';
    });

    window.electronAPI.onAdBlockerStatusChanged((isEnabled) => {
        adblockToggleBtn.style.color = isEnabled ? '#8ab4f8' : '#fff';
    });

    // 6. Iniciar
    createNewTab();
});