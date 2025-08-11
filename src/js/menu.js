document.addEventListener('DOMContentLoaded', () => {
    console.log('MENU.JS: Script carregado.'); // Log 1

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            console.log('MENU.JS: Item do menu clicado.'); // Log 2
            const action = item.getAttribute('data-action');
            if (action) {
                console.log(`MENU.JS: Ação encontrada: "${action}". A chamar a API...`); // Log 3
                window.electronPopupAPI.menuAction(action);
            }
        });
    });
});