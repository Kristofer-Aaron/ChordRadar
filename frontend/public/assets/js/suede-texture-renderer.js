(function () {
    if (window.__suedeTextureInitialized) return;
    window.__suedeTextureInitialized = true;

    const DEFAULT_CONFIG = {
        minTextureSize: 2048,
        maxTextureSize: 4096,
        overscanMultiplier: 2,
        renderScale: 1,
        tileEnabled: true,
        tileSize: 512,
        grainScale: 1,
        grainBase: 100,
        grainRange: 30,
        toneShiftRed: 10,
        toneShiftGreen: 5,
        toneShiftBlue: 0,
        alpha: 255,
        perlinEnabled: false,
        perlinScale: 96,
        perlinStrength: 14,
        perlinOctaves: 3,
        perlinPersistence: 0.5,
        perlinLacunarity: 2,
        perlinSeed: 1337
    };

    const USER_CONFIG = window.SUEDE_TEXTURE_CONFIG || {};

    let currentConfig = {};

    let MIN_TEXTURE_SIZE;
    let MAX_TEXTURE_SIZE;
    let OVERSCAN_MULTIPLIER;
    let RENDER_SCALE;
    let TILE_ENABLED;
    let TILE_SIZE;
    let GRAIN_SCALE;
    let GRAIN_BASE;
    let GRAIN_RANGE;
    let TONE_SHIFT_RED;
    let TONE_SHIFT_GREEN;
    let TONE_SHIFT_BLUE;
    let ALPHA;

    let PERLIN_ENABLED;
    let PERLIN_SCALE;
    let PERLIN_STRENGTH;
    let PERLIN_OCTAVES;
    let PERLIN_PERSISTENCE;
    let PERLIN_LACUNARITY;
    let PERLIN_SEED;

    const MAX_TEXTURE_PIXELS = 16777216;

    function getNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function applyConfig(nextConfig = {}, saveToGlobal = true) {
        currentConfig = {
            ...DEFAULT_CONFIG,
            ...currentConfig,
            ...nextConfig
        };

        MIN_TEXTURE_SIZE = Math.max(512, getNumber(currentConfig.minTextureSize, DEFAULT_CONFIG.minTextureSize));
        MAX_TEXTURE_SIZE = Math.max(MIN_TEXTURE_SIZE, getNumber(currentConfig.maxTextureSize, DEFAULT_CONFIG.maxTextureSize));
        OVERSCAN_MULTIPLIER = Math.min(3, Math.max(1, getNumber(currentConfig.overscanMultiplier, DEFAULT_CONFIG.overscanMultiplier)));
        RENDER_SCALE = Math.min(1, Math.max(0.125, getNumber(currentConfig.renderScale, DEFAULT_CONFIG.renderScale)));
        TILE_ENABLED = Boolean(currentConfig.tileEnabled);
        TILE_SIZE = Math.max(256, Math.min(2048, getNumber(currentConfig.tileSize, DEFAULT_CONFIG.tileSize)));
        GRAIN_SCALE = Math.max(0.5, getNumber(currentConfig.grainScale, DEFAULT_CONFIG.grainScale));
        GRAIN_BASE = getNumber(currentConfig.grainBase, DEFAULT_CONFIG.grainBase);
        GRAIN_RANGE = Math.max(0, getNumber(currentConfig.grainRange, DEFAULT_CONFIG.grainRange));
        TONE_SHIFT_RED = getNumber(currentConfig.toneShiftRed, DEFAULT_CONFIG.toneShiftRed);
        TONE_SHIFT_GREEN = getNumber(currentConfig.toneShiftGreen, DEFAULT_CONFIG.toneShiftGreen);
        TONE_SHIFT_BLUE = getNumber(currentConfig.toneShiftBlue, DEFAULT_CONFIG.toneShiftBlue);
        ALPHA = Math.max(0, Math.min(255, getNumber(currentConfig.alpha, DEFAULT_CONFIG.alpha)));

        PERLIN_ENABLED = Boolean(currentConfig.perlinEnabled);
        PERLIN_SCALE = Math.max(2, getNumber(currentConfig.perlinScale, DEFAULT_CONFIG.perlinScale));
        PERLIN_STRENGTH = getNumber(currentConfig.perlinStrength, DEFAULT_CONFIG.perlinStrength);
        PERLIN_OCTAVES = Math.max(1, Math.floor(getNumber(currentConfig.perlinOctaves, DEFAULT_CONFIG.perlinOctaves)));
        PERLIN_PERSISTENCE = Math.max(0, getNumber(currentConfig.perlinPersistence, DEFAULT_CONFIG.perlinPersistence));
        PERLIN_LACUNARITY = Math.max(1, getNumber(currentConfig.perlinLacunarity, DEFAULT_CONFIG.perlinLacunarity));
        PERLIN_SEED = Math.floor(getNumber(currentConfig.perlinSeed, DEFAULT_CONFIG.perlinSeed));

        if (saveToGlobal) {
            window.SUEDE_TEXTURE_CONFIG = { ...currentConfig };
        }
    }

    let storedConfig = {};
    try {
        storedConfig = JSON.parse(localStorage.getItem('suedeTextureConfig') || '{}');
    } catch (_) {
        storedConfig = {};
    }

    applyConfig({ ...storedConfig, ...USER_CONFIG });

    const cache = {
        width: 0,
        height: 0,
        sourceWidth: 0,
        sourceHeight: 0,
        dataUrl: ''
    };

    function ceilPowerOfTwo(value) {
        return Math.pow(2, Math.ceil(Math.log2(Math.max(1, value))));
    }

    function getTargetTextureSize() {
        if (TILE_ENABLED) {
            return { width: TILE_SIZE, height: TILE_SIZE };
        }

        const documentHeight = Math.max(
            window.innerHeight,
            document.documentElement?.scrollHeight || 0,
            document.body?.scrollHeight || 0
        );

        let width = Math.max(MIN_TEXTURE_SIZE, ceilPowerOfTwo(window.innerWidth * OVERSCAN_MULTIPLIER));
        let height = Math.max(MIN_TEXTURE_SIZE, ceilPowerOfTwo(documentHeight));

        width = Math.min(MAX_TEXTURE_SIZE, width);
        height = Math.min(MAX_TEXTURE_SIZE, height);

        const pixels = width * height;
        if (pixels > MAX_TEXTURE_PIXELS) {
            const ratio = Math.sqrt(MAX_TEXTURE_PIXELS / pixels);
            width = Math.max(512, Math.floor(width * ratio));
            height = Math.max(512, Math.floor(height * ratio));
        }

        return { width, height };
    }

    function wrapIndex(value, period) {
        if (period <= 0) return value;
        return ((value % period) + period) % period;
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function fade(t) {
        return t * t * (3 - 2 * t);
    }

    function hash2D(x, y) {
        let n = x * 374761393 + y * 668265263 + PERLIN_SEED * 69069;
        n = (n ^ (n >> 13)) * 1274126177;
        n = n ^ (n >> 16);
        return (n >>> 0) / 4294967295;
    }

    function periodicHash2D(x, y, periodX, periodY) {
        const wrappedX = wrapIndex(x, periodX);
        const wrappedY = wrapIndex(y, periodY);
        return hash2D(wrappedX, wrappedY);
    }

    function valueNoise2D(x, y) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const sx = fade(x - x0);
        const sy = fade(y - y0);

        const n00 = hash2D(x0, y0) * 2 - 1;
        const n10 = hash2D(x1, y0) * 2 - 1;
        const n01 = hash2D(x0, y1) * 2 - 1;
        const n11 = hash2D(x1, y1) * 2 - 1;

        const nx0 = lerp(n00, n10, sx);
        const nx1 = lerp(n01, n11, sx);
        return lerp(nx0, nx1, sy);
    }

    function valueNoise2DPeriodic(x, y, periodX, periodY) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const sx = fade(x - x0);
        const sy = fade(y - y0);

        const n00 = periodicHash2D(x0, y0, periodX, periodY) * 2 - 1;
        const n10 = periodicHash2D(x1, y0, periodX, periodY) * 2 - 1;
        const n01 = periodicHash2D(x0, y1, periodX, periodY) * 2 - 1;
        const n11 = periodicHash2D(x1, y1, periodX, periodY) * 2 - 1;

        const nx0 = lerp(n00, n10, sx);
        const nx1 = lerp(n01, n11, sx);
        return lerp(nx0, nx1, sy);
    }

    function fbmNoise2D(x, y) {
        let amplitude = 1;
        let frequency = 1;
        let value = 0;
        let amplitudeSum = 0;

        for (let octave = 0; octave < PERLIN_OCTAVES; octave++) {
            value += valueNoise2D(x * frequency, y * frequency) * amplitude;
            amplitudeSum += amplitude;
            amplitude *= PERLIN_PERSISTENCE;
            frequency *= PERLIN_LACUNARITY;
        }

        return amplitudeSum > 0 ? value / amplitudeSum : 0;
    }

    function fbmNoise2DPeriodic(x, y, periodX, periodY) {
        let amplitude = 1;
        let frequency = 1;
        let value = 0;
        let amplitudeSum = 0;

        for (let octave = 0; octave < PERLIN_OCTAVES; octave++) {
            const octavePeriodX = Math.max(1, Math.round(periodX * frequency));
            const octavePeriodY = Math.max(1, Math.round(periodY * frequency));

            value += valueNoise2DPeriodic(x * frequency, y * frequency, octavePeriodX, octavePeriodY) * amplitude;
            amplitudeSum += amplitude;
            amplitude *= PERLIN_PERSISTENCE;
            frequency *= PERLIN_LACUNARITY;
        }

        return amplitudeSum > 0 ? value / amplitudeSum : 0;
    }

    function sealTileEdges(context, width, height) {
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let y = 0; y < height; y++) {
            const rowStart = y * width * 4;
            const firstPixel = rowStart;
            const lastPixel = rowStart + (width - 1) * 4;

            data[lastPixel] = data[firstPixel];
            data[lastPixel + 1] = data[firstPixel + 1];
            data[lastPixel + 2] = data[firstPixel + 2];
            data[lastPixel + 3] = data[firstPixel + 3];
        }

        for (let x = 0; x < width; x++) {
            const firstPixel = x * 4;
            const lastPixel = ((height - 1) * width + x) * 4;

            data[lastPixel] = data[firstPixel];
            data[lastPixel + 1] = data[firstPixel + 1];
            data[lastPixel + 2] = data[firstPixel + 2];
            data[lastPixel + 3] = data[firstPixel + 3];
        }

        context.putImageData(imageData, 0, 0);
    }

    function generateTexture(width, height) {
        const sourceCanvas = document.createElement('canvas');
        const context = sourceCanvas.getContext('2d');

        if (!context) return;

        const sourceWidth = TILE_ENABLED ? width : Math.max(256, Math.floor(width * RENDER_SCALE));
        const sourceHeight = TILE_ENABLED ? height : Math.max(256, Math.floor(height * RENDER_SCALE));

        sourceCanvas.width = sourceWidth;
        sourceCanvas.height = sourceHeight;

        const imageData = context.createImageData(sourceWidth, sourceHeight);
        const data = imageData.data;
        const perlinPeriodX = Math.max(1, Math.round(width / PERLIN_SCALE));
        const perlinPeriodY = Math.max(1, Math.round(height / PERLIN_SCALE));
        const grainPeriodX = Math.max(1, Math.round(width / GRAIN_SCALE));
        const grainPeriodY = Math.max(1, Math.round(height / GRAIN_SCALE));

        for (let y = 0; y < sourceHeight; y++) {
            for (let x = 0; x < sourceWidth; x++) {
                const index = (y * sourceWidth + x) * 4;
                const sampleX = x / RENDER_SCALE;
                const sampleY = y / RENDER_SCALE;
                const perlin = PERLIN_ENABLED
                    ? (TILE_ENABLED
                        ? fbmNoise2DPeriodic(sampleX / PERLIN_SCALE, sampleY / PERLIN_SCALE, perlinPeriodX, perlinPeriodY)
                        : fbmNoise2D(sampleX / PERLIN_SCALE, sampleY / PERLIN_SCALE)) * PERLIN_STRENGTH
                    : 0;

                const grainNoise = TILE_ENABLED
                    ? valueNoise2DPeriodic(sampleX / GRAIN_SCALE, sampleY / GRAIN_SCALE, grainPeriodX, grainPeriodY)
                    : hash2D(Math.floor(sampleX), Math.floor(sampleY)) * 2 - 1;

                const grain = GRAIN_BASE + ((grainNoise + 1) * 0.5 * GRAIN_RANGE) + perlin;

                data[index] = Math.max(0, Math.min(255, grain + TONE_SHIFT_RED));
                data[index + 1] = Math.max(0, Math.min(255, grain + TONE_SHIFT_GREEN));
                data[index + 2] = Math.max(0, Math.min(255, grain + TONE_SHIFT_BLUE));
                data[index + 3] = ALPHA;
            }
        }

        context.putImageData(imageData, 0, 0);

        let outputCanvas = sourceCanvas;

        if (TILE_ENABLED) {
            sealTileEdges(context, width, height);
        } else if (sourceWidth !== width || sourceHeight !== height) {
            outputCanvas = document.createElement('canvas');
            outputCanvas.width = width;
            outputCanvas.height = height;

            const outputContext = outputCanvas.getContext('2d');
            if (!outputContext) {
                return;
            }

            outputContext.imageSmoothingEnabled = true;
            outputContext.drawImage(sourceCanvas, 0, 0, width, height);
        }

        cache.width = width;
        cache.height = height;
        cache.sourceWidth = sourceWidth;
        cache.sourceHeight = sourceHeight;
        cache.dataUrl = outputCanvas.toDataURL('image/png');

        return true;
    }

    function ensureTextureForViewport(force = false) {
        const { width, height } = getTargetTextureSize();

        if (!force && cache.dataUrl && cache.width >= width && cache.height >= height) {
            return;
        }

        let generated = false;

        try {
            generated = generateTexture(width, height);
        } catch (_) {
            generated = false;
        }

        if (generated) {
            return;
        }

        const fallbackWidth = Math.max(1024, Math.floor(width / 2));
        const fallbackHeight = Math.max(1024, Math.floor(height / 2));

        try {
            generateTexture(fallbackWidth, fallbackHeight);
        } catch (_) {
            cache.width = 0;
            cache.height = 0;
            cache.dataUrl = '';
        }
    }

    function applyTextureStyles(target) {
        if (!target || !cache.dataUrl) return;

        target.style.setProperty('background-image', `url(${cache.dataUrl})`, 'important');
        target.style.setProperty('background-repeat', TILE_ENABLED ? 'repeat' : 'no-repeat', 'important');
        target.style.setProperty('background-size', `${cache.width}px ${cache.height}px`, 'important');
        target.style.setProperty('background-attachment', 'scroll', 'important');
        target.style.setProperty('background-position', '0 0', 'important');
    }

    function applyTextureToPage() {
        const body = document.body;
        const html = document.documentElement;
        if (!body || !html || !cache.dataUrl) return;

        applyTextureStyles(html);

        body.style.removeProperty('background-image');
        body.style.removeProperty('background-repeat');
        body.style.removeProperty('background-size');
        body.style.removeProperty('background-attachment');
        body.style.removeProperty('background-position');
        body.style.setProperty('background-color', 'transparent', 'important');
    }

    function renderTexture(force = false) {
        ensureTextureForViewport(force);
        applyTextureToPage();
    }

    function init() {
        renderTexture(true);

        window.addEventListener('resize', renderTexture);

        const mutationObserver = new MutationObserver(() => {
            applyTextureToPage();
        });

        mutationObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-bs-theme']
        });

        if (document.body) {
            mutationObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }

        window.SuedeTextureRenderer = {
            isLoaded: true,
            regenerate(nextConfig = null) {
                if (nextConfig && typeof nextConfig === 'object') {
                    applyConfig(nextConfig);
                    try {
                        localStorage.setItem('suedeTextureConfig', JSON.stringify(window.SUEDE_TEXTURE_CONFIG));
                    } catch (_) {}
                }

                cache.width = 0;
                cache.height = 0;
                cache.sourceWidth = 0;
                cache.sourceHeight = 0;
                cache.dataUrl = '';

                renderTexture(true);
            },
            getConfig() {
                return { ...currentConfig };
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();