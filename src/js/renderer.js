// renderer.js
const backButton = document.getElementById('back');
const forwardButton = document.getElementById('forward');
const refreshButton = document.getElementById('refresh');
const urlInput = document.getElementById('url');
const addFavoriteButton = document.getElementById('add-favorite');
const favoritesList = document.getElementById('favorites-list');

// Função para carregar e exibir os favoritos
const updateFavoritesList = () => {
    const favorites = window.electronAPI.getFavorites(); // Usa a API do preload
    favoritesList.innerHTML = ''; // Limpa a lista atual

    favorites.forEach((favorite, index) => {
        const favoriteItem = document.createElement('div');
        favoriteItem.classList.add('favorite-item');

        const link = document.createElement('a');
        link.href = '#';
        link.textContent = favorite.title || favorite.url;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.electronAPI.send('navigate', favorite.url); // Usa a API do preload
        });

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remover';
        removeButton.addEventListener('click', () => {
            removeFavorite(index);
        });

        favoriteItem.appendChild(link);
        favoriteItem.appendChild(removeButton);
        favoritesList.appendChild(favoriteItem);
    });
};

// Função para remover um favorito pelo seu índice
const removeFavorite = (index) => {
    let favorites = window.electronAPI.getFavorites(); // Usa a API do preload
    favorites.splice(index, 1);
    window.electronAPI.saveFavorites(favorites); // Usa a API do preload
    updateFavoritesList();
};

// Carrega os favoritos quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
    updateFavoritesList();
});

// Eventos dos botões de navegação
backButton.addEventListener('click', () => {
    window.electronAPI.send('go-back'); // Usa a API do preload
});

forwardButton.addEventListener('click', () => {
    window.electronAPI.send('go-forward'); // Usa a API do preload
});

refreshButton.addEventListener('click', () => {
    window.electronAPI.send('reload'); // Usa a API do preload
});

// Navegação pela barra de endereço
urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        let url = e.target.value;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        window.electronAPI.send('navigate', url); // Usa a API do preload
    }
});

// Adicionar aos favoritos
addFavoriteButton.addEventListener('click', async () => {
    const url = await window.electronAPI.invoke('get-current-url'); // Usa a API do preload
    const title = await window.electronAPI.invoke('get-current-title'); // Usa a API do preload
    
    let favorites = window.electronAPI.getFavorites(); // Usa a API do preload
    if (!favorites.some(fav => fav.url === url)) {
        favorites.push({ url, title });
        window.electronAPI.saveFavorites(favorites); // Usa a API do preload
        updateFavoritesList();
    }
});

// Atualiza a URL na barra de endereço
window.electronAPI.on('url-updated', (url) => { // Usa a API do preload
    urlInput.value = url;
});