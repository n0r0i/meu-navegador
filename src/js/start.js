document.addEventListener('DOMContentLoaded', () => {
    // Lógica do Papel de Parede
    const params = new URLSearchParams(window.location.search);
    const bgPath = params.get('bg');
    if (bgPath) {
        const imageUrl = bgPath.replaceAll('\\', '/');
        document.documentElement.style.setProperty('--bg-image', `url('${imageUrl}')`);
    }

    // Lógica do Relógio
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        document.getElementById('clock-time').textContent = `${hours}:${minutes}`;
        document.getElementById('clock-seconds').textContent = seconds;
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('date-container').textContent = now.toLocaleDateString('pt-BR', dateOptions);
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Lógica da Barra de Pesquisa
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                window.electronViewAPI.navigateTo(searchUrl);
            }
        }
    });

    // Lógica do Clima (Exemplo)
    const weatherEl = document.getElementById('weather-container');
    weatherEl.textContent = 'São Paulo: 17°C 🌦️';
});