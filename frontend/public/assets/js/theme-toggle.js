(function () {
    const toggle = document.getElementById('theme-toggle');
    const label = document.getElementById('theme-toggle-label');
    const html = document.documentElement;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');

    const suedePresets = {
        light: {
            tileEnabled: true,
            tileSize: 512,
            grainScale: 1,
            renderScale: 1,
            perlinEnabled: false,
            grainBase: 118,
            grainRange: 22,
            toneShiftRed: 12,
            toneShiftGreen: 8,
            toneShiftBlue: 2,
            alpha: 255
        },
        dark: {
            tileEnabled: true,
            tileSize: 512,
            grainScale: 1,
            renderScale: 1,
            perlinEnabled: false,
            grainBase: 52,
            grainRange: 20,
            toneShiftRed: 0,
            toneShiftGreen: -2,
            toneShiftBlue: -4,
            alpha: 255
        }
    };

    function applySuedePresetForTheme(theme) {
        const preset = theme === 'dark' ? suedePresets.dark : suedePresets.light;
        const mergedConfig = {
            ...(window.SUEDE_TEXTURE_CONFIG || {}),
            ...preset
        };

        window.SUEDE_TEXTURE_CONFIG = mergedConfig;

        try {
            localStorage.setItem('suedeTextureConfig', JSON.stringify(mergedConfig));
        } catch (_) {}

        if (!window.SuedeTextureRenderer || typeof window.SuedeTextureRenderer.regenerate !== 'function') {
            return;
        }

        window.SuedeTextureRenderer.regenerate(mergedConfig);
    }

    function setTheme(theme) {
        html.setAttribute('data-bs-theme', theme);

        label.textContent = theme === 'dark' ? 'Light' : 'Dark';
        applySuedePresetForTheme(theme);
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