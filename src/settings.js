// Abrir seletor de imagem
document.getElementById('bg-picker-btn').addEventListener('click', () => {
    window.settingsAPI.openBgDialog();
});

// Receber caminho da imagem escolhida
window.settingsAPI.onBgSelected((path) => {
    if (path) {
        document.getElementById('current-bg').textContent = `Atual: ${path}`;
    }
});

// Remover imagem de fundo
document.getElementById('bg-remove-btn').addEventListener('click', () => {
    window.settingsAPI.removeBgImage();
    document.getElementById('current-bg').textContent = "Imagem Removida";
});
