window.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.getElementById('tabs-container');
    const newTabBtn = document.getElementById('new-tab-btn');
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const urlInput = document.getElementById('url-input');
        // NOVO: Seleciona o botão Tor
    const torToggleBtn = document.getElementById('tor-toggle-btn');
        const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.addEventListener('click', () => {
        window.electronAPI.openSettings();
    });
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');

    let tabs = new Map();
    let activeTabId = null;

    // Em renderer.js, dentro do window.addEventListener('DOMContentLoaded', ...)
document.getElementById('settings-btn').addEventListener('click', () => {
    window.electronAPI.openSettings(); // Precisaremos adicionar isso no preload
});

    //adblock
    const adblockToggleBtn = document.getElementById('adblock-toggle-btn');


        // NOVO: Ouve o pedido do main process para criar uma nova aba para uma URL específica
    window.electronAPI.onCreateNewTabForUrl((url) => {
        // Reutiliza a nossa função de criar abas que já existe!
        createNewTab(url);
    });
    

    function createNewTab(url) { // URL agora é opcional
        const tabId = `tab-${Date.now()}`;
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-item';
        tabElement.dataset.tabId = tabId;
        tabElement.innerHTML = `<span class="tab-title">Carregando...</span><button class="close-tab-btn">×</button>`;
        tabsContainer.appendChild(tabElement);
        tabs.set(tabId, { element: tabElement });
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
            // Se não houver mais abas, fecha o app
            if (!lastTabId) {
                window.close();
            } else {
                setActiveTab(lastTabId);
            }
        }
    }


// --- Lógica do Botão Tor ---
    torToggleBtn.addEventListener('click', () => {
        window.electronAPI.toggleTor();
    });
    window.electronAPI.onTorStatusChanged((isTorEnabled) => {
        if (isTorEnabled) {
            torToggleBtn.classList.add('active');
            torToggleBtn.title = 'Modo Anônimo (Tor) Ativado';
        } else {
            torToggleBtn.classList.remove('active');
            torToggleBtn.title = 'Ativar/Desativar Modo Anônimo (Tor)';
        }
    });

    // --- NOVO: Lógica do Botão de Bloqueio ---
    adblockToggleBtn.addEventListener('click', () => {
        window.electronAPI.toggleAdBlocker();
    });
    window.electronAPI.onAdBlockerStatusChanged((isAdBlockerEnabled) => {
        if (isAdBlockerEnabled) {
            adblockToggleBtn.classList.add('active');
            adblockToggleBtn.title = 'Bloqueador Ativado';
        } else {
            adblockToggleBtn.classList.remove('active');
            adblockToggleBtn.title = 'Bloqueador Desativado';
        }
        // Sugestão: Recarregar a página ativa para aplicar as novas regras
        window.electronAPI.reload();
    });


// A VERSÃO CORRIGIDA
window.electronAPI.onTabUpdated((data) => {
    const tab = tabs.get(data.id);
    if (tab) {
        tab.element.querySelector('.tab-title').textContent = data.title;
        if (data.id === activeTabId) {
            if (document.activeElement !== urlInput) {
                // ✅ LÓGICA CORRIGIDA AQUI
                if (data.url.startsWith('file://')) {
                    urlInput.value = ''; // Limpa a barra de URL
                } else {
                    urlInput.value = data.url; // Mantém o comportamento para sites normais
                }
            }
            backBtn.disabled = !data.canGoBack;
            forwardBtn.disabled = !data.canGoForward;
        }
    }

    // DENTRO DE renderer.js

window.electronAPI.onCreateNewTabFromLibrary((url) => {
    createTab(url, true); // O 'createTab' é a sua função que já cria abas
});

// E no seu preload.js, adicione a permissão:
onCreateNewTabFromLibrary: (callback) => ipcRenderer.on('create-new-tab-from-library', (_event, url) => callback(url)),


// Este listener atualiza a cor do botão sempre que um favorito é adicionado/removido
window.electronAPI.onBookmarkUpdated(async ({ url }) => {
    const activeTab = tabs.get(activeTabId);
    // Só atualiza se o favorito modificado for o da aba ativa
    if (activeTab && activeTab.url === url) {
        const isBookmarked = await window.electronAPI.isBookmarked(url);
        addBookmarkBtn.style.color = isBookmarked ? '#8ab4f8' : ''; // Azul se for favorito, padrão se não for
    }
});

// Também modifique o seu onTabUpdated para fazer a mesma verificação
window.electronAPI.onTabUpdated(async ({ tabId, url, title, canGoBack, canGoForward }) => {
    // ... (seu código existente para atualizar tabs, urlInput, etc)

    // Lógica para atualizar a cor do botão de favoritos ao mudar de aba ou carregar a página
    const isBookmarked = await window.electronAPI.isBookmarked(url);
    addBookmarkBtn.style.color = isBookmarked ? '#8ab4f8' : '';
});

    // Busca a informação da aba ativa (você já tem 'tabs' e 'activeTabId' no seu código)
    const activeTab = tabs.get(activeTabId);
    
    // Garante que a aba existe e não é uma página interna do navegador
    if (activeTab && activeTab.url && !activeTab.url.startsWith('file:')) {
        // Envia os dados para o main.js através da API que criámos no preload
        window.electronAPI.addBookmark({
            url: activeTab.url,
            title: activeTab.title,
            timestamp: Date.now()
        });
        
        // Dá um feedback visual imediato ao utilizador, mudando a cor do botão
        addBookmarkBtn.style.color = '#8ab4f8'; // Cor de destaque azul
    }

});

    newTabBtn.addEventListener('click', () => createNewTab(null)); // Chama sem URL para abrir a tela de início
    tabsContainer.addEventListener('click', (event) => {
        const tabElement = event.target.closest('.tab-item');
        if (!tabElement) return;
        const tabId = tabElement.dataset.tabId;
        if (event.target.classList.contains('close-tab-btn')) closeTab(tabId);
        else setActiveTab(tabId);
    });
    backBtn.addEventListener('click', () => window.electronAPI.goBack());
    forwardBtn.addEventListener('click', () => window.electronAPI.goForward());
    reloadBtn.addEventListener('click', () => window.electronAPI.reload());
    


   // Dentro de renderer.js

// Substitua o bloco de código anterior por este teste simples:
addBookmarkBtn.addEventListener('click', () => {
    alert('TESTE: O botão de favoritos foi clicado!');
    console.log('O clique no botão de favoritos está a ser detetado corretamente.');
});


    urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const inputText = event.target.value.trim();
            if (!inputText) return;
            let navigateUrl;
            const isUrl = (inputText.includes('.') && !inputText.includes(' ')) || inputText.startsWith('http');
            if (isUrl) {
                navigateUrl = inputText.startsWith('http') ? inputText : 'https://' + inputText;
            } else {
                navigateUrl = `https://www.google.com/search?q=${encodeURIComponent(inputText)}`;
            }
            window.electronAPI.navigateTo(navigateUrl);
        }
    });
    
    createNewTab(null); // Abre a primeira aba com a tela de início


    // NOVO: Adiciona um listener de clique direito à barra de URL
urlInput.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Impede o menu padrão do sistema de aparecer
    window.electronAPI.showInputContextMenu(); // Pede ao main.js para mostrar o nosso menu


    
});



});