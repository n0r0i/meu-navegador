// src/js/library.js - VERSÃO COMPLETA E FUNCIONAL

document.addEventListener('DOMContentLoaded', () => {
    const bookmarksList = document.getElementById('bookmarks-list');
    const clearBookmarksBtn = document.getElementById('clear-bookmarks-btn');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('pt-PT');
    };

    // Função genérica para criar um item na lista
    const createListItem = (item, type) => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';

        const icon = document.createElement('img');
        icon.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}`;
        icon.alt = 'ícone';

        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.title || item.url;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.electronAPI.openLinkInNewTab(item.url);
        });

        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = formatDate(item.timestamp);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', () => {
            if (type === 'bookmark') {
                window.electronAPI.removeBookmark(item.url);
            }
            // A funcionalidade de apagar histórico individual pode ser adicionada depois
            listItem.remove(); 
        });

        listItem.appendChild(icon);
        listItem.appendChild(link);
        listItem.appendChild(timestamp);
        // Só adiciona o botão de apagar para favoritos por enquanto
        if (type === 'bookmark') {
            listItem.appendChild(deleteBtn);
        }
        
        return listItem;
    };

    // Carregar Favoritos
    const loadBookmarks = async () => {
        bookmarksList.innerHTML = '';
        const bookmarks = await window.electronAPI.getBookmarks();
        if (bookmarks && bookmarks.length > 0) {
            bookmarks.forEach(bookmark => {
                bookmarksList.appendChild(createListItem(bookmark, 'bookmark'));
            });
        } else {
            bookmarksList.innerHTML = '<p>Nenhum favorito adicionado.</p>';
        }
    };

    // Carregar Histórico
    const loadHistory = async () => {
        historyList.innerHTML = '';
        const history = await window.electronAPI.getHistory();
        if (history && history.length > 0) {
            history.forEach(item => {
                historyList.appendChild(createListItem(item, 'history'));
            });
        } else {
            historyList.innerHTML = '<p>O seu histórico de navegação está vazio.</p>';
        }
    };

    // Listeners dos botões de limpar tudo
    clearBookmarksBtn.addEventListener('click', () => {
        window.electronAPI.clearBookmarks();
        loadBookmarks();
    });

    clearHistoryBtn.addEventListener('click', () => {
        window.electronAPI.clearHistory();
        loadHistory();
    });

    // Carregar tudo ao iniciar
    loadBookmarks();
    loadHistory();
});