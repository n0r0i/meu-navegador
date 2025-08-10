// Espera que o conteúdo da página esteja totalmente carregado
document.addEventListener('DOMContentLoaded', () => {
    const bookmarksList = document.getElementById('bookmarks-list');
    const clearBookmarksBtn = document.getElementById('clear-bookmarks-btn');

    // Função para formatar a data de forma amigável
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Função principal que busca e exibe os favoritos
    const loadBookmarks = async () => {
        // Limpa a lista atual para não duplicar
        bookmarksList.innerHTML = '';

        // Pede a lista de favoritos ao main.js
        const bookmarks = await window.electronAPI.getBookmarks();

        if (bookmarks && bookmarks.length > 0) {
            bookmarks.forEach(bookmark => {
                // Cria os elementos HTML para cada favorito
                const item = document.createElement('div');
                item.className = 'list-item';

                // Ícone do site (favicon)
                const icon = document.createElement('img');
                icon.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${bookmark.url}`;
                icon.alt = 'ícone';

                // Link com o título
                const link = document.createElement('a');
                link.href = bookmark.url;
                link.textContent = bookmark.title || bookmark.url;
                // Adiciona um evento para abrir o link no navegador principal
                link.addEventListener('click', (e) => {
                    e.preventDefault(); // Impede a navegação padrão
                    window.electronAPI.openLinkInNewTab(bookmark.url);
                });

                // Data de adição
                const timestamp = document.createElement('span');
                timestamp.className = 'timestamp';
                timestamp.textContent = `Adicionado em: ${formatDate(bookmark.timestamp)}`;
                
                // Botão de apagar
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '🗑️';
                deleteBtn.title = 'Remover favorito';
                deleteBtn.addEventListener('click', () => {
                    // Envia o pedido para remover este favorito específico
                    window.electronAPI.removeBookmark(bookmark.url);
                    // Remove o item da vista imediatamente para um feedback rápido
                    item.remove();
                });

                // Adiciona todos os elementos ao item da lista
                item.appendChild(icon);
                item.appendChild(link);
                item.appendChild(timestamp);
                item.appendChild(deleteBtn);
                
                // Adiciona o item completo à lista na página
                bookmarksList.appendChild(item);
            });
        } else {
            // Mensagem caso não haja favoritos
            bookmarksList.innerHTML = '<p>Você ainda não adicionou nenhum favorito.</p>';
        }
    };

    // Evento para o botão de limpar tudo
    clearBookmarksBtn.addEventListener('click', () => {
        if (confirm('Tem a certeza de que quer apagar TODOS os seus favoritos?')) {
            window.electronAPI.clearBookmarks();
            // Recarrega a lista (que agora estará vazia)
            loadBookmarks();
        }
    });

    // Carrega os favoritos assim que a página abre
    loadBookmarks();
});