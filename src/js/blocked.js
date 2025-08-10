document.addEventListener('DOMContentLoaded', () => {
    const urlSpan = document.getElementById('blocked-url');
    const whitelistBtn = document.getElementById('whitelist-btn');

    // Pega a URL bloqueada que foi passada como parâmetro
    const params = new URLSearchParams(window.location.search);
    const blockedUrl = params.get('url');
    
    if (blockedUrl) {
        const domain = new URL(blockedUrl).hostname;
        urlSpan.textContent = domain;

        whitelistBtn.addEventListener('click', () => {
            // Avisa o processo principal para adicionar o domínio à whitelist e recarregar
            window.electronAPI.addToWhitelist(domain, blockedUrl);
            whitelistBtn.textContent = 'Recarregando...';
            whitelistBtn.disabled = true;
        });
    }
});