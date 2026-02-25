(function () {
    const toggle = document.getElementById('theme-toggle');
    const label = document.getElementById('theme-toggle-label');
    const html = document.documentElement;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');

    function setTheme(theme) {
        html.setAttribute('data-bs-theme', theme);

        label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    }

    // init
    if (stored) {
        setTheme(stored);
    } else {
        setTheme(prefersDark ? 'dark' : 'light');
    }

    toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-bs-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        setTheme(next);
    });
})();