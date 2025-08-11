const { ipcRenderer } = require('electron');

const backButton = document.getElementById('back');
const forwardButton = document.getElementById('forward');
const refreshButton = document.getElementById('refresh');
const urlInput = document.getElementById('url');
const addFavoriteButton = document.getElementById('add-favorite');
const favoritesList = document.getElementById('favorites-list');

// Função para carregar e exibir os favoritos
const updateFavoritesList = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favoritesList.innerHTML = ''; // Limpa a lista atual

    favorites.forEach((favorite, index) => {
        const favoriteItem = document.createElement('div');
        favoriteItem.classList.add('favorite-item');

        const link = document.createElement('a');
        link.href = '#';
        link.textContent = favorite.title || favorite.url; // Mostra o título ou a URL
        link.addEventListener('click', (e) => {
            e.preventDefault();
            ipcRenderer.send('navigate', favorite.url);
        });

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remover';
        removeButton.addEventListener('click', () => {
            removeFavorite(index); // Passa o índice para a função de remoção
        });

        favoriteItem.appendChild(link);
        favoriteItem.appendChild(removeButton);
        favoritesList.appendChild(favoriteItem);
    });
};

// Função para remover um favorito pelo seu índice
const removeFavorite = (index) => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites.splice(index, 1); // Remove o item no índice especificado
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesList(); // Atualiza a lista na tela
};

// Carrega os favoritos quando a página é carregada pela primeira vez
document.addEventListener('DOMContentLoaded', () => {
    updateFavoritesList();
});

// Eventos dos botões de navegação
backButton.addEventListener('click', () => {
    ipcRenderer.send('go-back');
});

forwardButton.addEventListener('click', () => {
    ipcRenderer.send('go-forward');
});

refreshButton.addEventListener('click', () => {
    ipcRenderer.send('reload');
});

// Navegação pela barra de endereço
urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        let url = e.target.value;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        ipcRenderer.send('navigate', url);
    }
});

// Adicionar aos favoritos
addFavoriteButton.addEventListener('click', () => {
    ipcRenderer.invoke('get-current-url').then(url => {
        ipcRenderer.invoke('get-current-title').then(title => {
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            // Evita adicionar favoritos duplicados
            if (!favorites.some(fav => fav.url === url)) {
                favorites.push({ url, title });
                localStorage.setItem('favorites', JSON.stringify(favorites));
                updateFavoritesList();
            }
        });
    });
});

// Atualiza a URL na barra de endereço
ipcRenderer.on('url-updated', (event, url) => {
    urlInput.value = url;
});