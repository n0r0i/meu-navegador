document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            if (action) {
                // Usa a API correta exposta no preload-popup.js
                window.electronPopupAPI.menuAction(action);
            }
        });
    });
});