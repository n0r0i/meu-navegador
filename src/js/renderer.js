// src/js/renderer.js - VERSÃO FINAL E CORRIGIDA

document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.getElementById('tabs-container');
    const newTabBtn = document.getElementById('new-tab-btn');
    const urlInput = document.getElementById('url-input');
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const adblockToggleBtn = document.getElementById('adblock-toggle-btn');
    const torToggleBtn = document.getElementById('tor-toggle-btn');
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const settingsBtn = document.getElementById('settings-btn'); // Botão da engrenagem

    let tabs = new Map();
    let activeTabId = null;

    function createTab(url = null, makeActive = true) {
        const id = `tab-${Date.now()}`;
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-item';
        tabElement.id = id;
        tabElement.innerHTML = `<img class="tab-icon" src="icon.png"><span class="tab-title">Nova Aba</span><button class="close-tab-btn">×</button>`;
        tabsContainer.appendChild(tabElement);
        tabs.set(id, { element: tabElement, url: url, title: 'Nova Aba' });
        window.electronAPI.createTab(id, url);
        if (makeActive) {
            setActiveTab(id);
        }
        tabElement.addEventListener('click', () => setActiveTab(id));
        tabElement.querySelector('.close-tab-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(id);
        });
    }

    function setActiveTab(id) {
        if (activeTabId) {
            tabs.get(activeTabId)?.element.classList.remove('active');
        }
        activeTabId = id;
        const tab = tabs.get(id);
        if (tab) {
            tab.element.classList.add('active');
            window.electronAPI.setActiveTab(id);
            urlInput.value = tab.url || '';
        }
    }

    function closeTab(id) {
        const tab = tabs.get(id);
        if (tab) {
            tab.element.remove();
            tabs.delete(id);
            window.electronAPI.closeTab(id);
            if (activeTabId === id && tabs.size > 0) {
                setActiveTab(tabs.keys().next().value);
            } else if (tabs.size === 0) {
                createTab();
            }
        }
    }

    // --- Listeners dos Botões ---
    newTabBtn.addEventListener('click', () => createTab());

    backBtn.addEventListener('click', () => window.electronAPI.goBack());
    forwardBtn.addEventListener('click', () => window.electronAPI.goForward());
    reloadBtn.addEventListener('click', () => window.electronAPI.reload());

    // ✅ CORREÇÃO: Chamando a função com o nome correto: openMainMenu
    settingsBtn.addEventListener('click', () => {
        window.electronAPI.openMainMenu();
    });

    urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            let url = urlInput.value.trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                if (url.includes('.') && !url.includes(' ')) {
                    url = 'https://' + url;
                } else {
                    url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
                }
            }
            window.electronAPI.navigateTo(url);
        }
    });

    // --- Listeners de Atualizações (vindos do main.js) ---
    window.electronAPI.onTabUpdated(async ({ id, title, url, canGoBack, canGoForward }) => {
        const tab = tabs.get(id);
        if (tab) {
            tab.url = url;
            tab.title = title;
            tab.element.querySelector('.tab-title').textContent = title;
            tab.element.querySelector('.tab-icon').src = `https://www.google.com/s2/favicons?sz=16&domain_url=${url}`;
            if (id === activeTabId) {
                urlInput.value = url;
                backBtn.disabled = !canGoBack;
                forwardBtn.disabled = !canGoForward;
                // Atualiza a cor do botão de favoritos
                const isBookmarked = await window.electronAPI.isBookmarked(url);
                addBookmarkBtn.style.color = isBookmarked ? '#8ab4f8' : '';
            }
        }
    });
    
    // --- Lógica de Favoritos ---
    addBookmarkBtn.addEventListener('click', () => {
        const activeTab = tabs.get(activeTabId);
        if (activeTab && activeTab.url && !activeTab.url.startsWith('file:')) {
            window.electronAPI.addBookmark({ url: activeTab.url, title: activeTab.title, timestamp: Date.now() });
        }
    });

    window.electronAPI.onBookmarkUpdated(async ({ url }) => {
        const activeTab = tabs.get(activeTabId);
        if (activeTab && activeTab.url === url) {
            const isBookmarked = await window.electronAPI.isBookmarked(url);
            addBookmarkBtn.style.color = isBookmarked ? '#8ab4f8' : '';
        }
    });

    // Ouve o pedido da biblioteca para criar uma nova aba
    window.electronAPI.onCreateNewTabFromLibrary((url) => {
        createTab(url, true);
    });

    createTab(); // Cria a primeira aba ao iniciar
});