<?php
$title = "Suede Texture Demo";

$navbarType = 'default';
$navbarOptions = [
    'showGuitarSettingsButton' => false,
];

$head = <<<'HTML'

<script>
(function () {
    const defaults = {
        minTextureSize: 2048,
        maxTextureSize: 4096,
        overscanMultiplier: 2,
        renderScale: 0.5,
        tileEnabled: true,
        tileSize: 1024,
        grainScale: 2,
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

    function toNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function sanitizeConfig(raw) {
        const merged = { ...defaults, ...(raw || {}) };

        return {
            minTextureSize: clamp(toNumber(merged.minTextureSize, defaults.minTextureSize), 512, 4096),
            maxTextureSize: clamp(toNumber(merged.maxTextureSize, defaults.maxTextureSize), 1024, 4096),
            overscanMultiplier: clamp(toNumber(merged.overscanMultiplier, defaults.overscanMultiplier), 1, 3),
            renderScale: clamp(toNumber(merged.renderScale, defaults.renderScale), 0.125, 1),
            tileEnabled: Boolean(merged.tileEnabled),
            tileSize: clamp(toNumber(merged.tileSize, defaults.tileSize), 256, 2048),
            grainScale: clamp(toNumber(merged.grainScale, defaults.grainScale), 0.5, 16),
            grainBase: clamp(toNumber(merged.grainBase, defaults.grainBase), 0, 255),
            grainRange: clamp(toNumber(merged.grainRange, defaults.grainRange), 0, 120),
            toneShiftRed: clamp(toNumber(merged.toneShiftRed, defaults.toneShiftRed), -100, 100),
            toneShiftGreen: clamp(toNumber(merged.toneShiftGreen, defaults.toneShiftGreen), -100, 100),
            toneShiftBlue: clamp(toNumber(merged.toneShiftBlue, defaults.toneShiftBlue), -100, 100),
            alpha: clamp(toNumber(merged.alpha, defaults.alpha), 32, 255),
            perlinEnabled: Boolean(merged.perlinEnabled),
            perlinScale: clamp(toNumber(merged.perlinScale, defaults.perlinScale), 2, 512),
            perlinStrength: clamp(toNumber(merged.perlinStrength, defaults.perlinStrength), 0, 64),
            perlinOctaves: clamp(Math.floor(toNumber(merged.perlinOctaves, defaults.perlinOctaves)), 1, 6),
            perlinPersistence: clamp(toNumber(merged.perlinPersistence, defaults.perlinPersistence), 0, 1),
            perlinLacunarity: clamp(toNumber(merged.perlinLacunarity, defaults.perlinLacunarity), 1, 4),
            perlinSeed: Math.floor(toNumber(merged.perlinSeed, defaults.perlinSeed))
        };
    }

    try {
        const stored = localStorage.getItem('suedeTextureConfig');
        if (stored) {
            window.SUEDE_TEXTURE_CONFIG = sanitizeConfig(JSON.parse(stored));
            localStorage.setItem('suedeTextureConfig', JSON.stringify(window.SUEDE_TEXTURE_CONFIG));
        } else {
            window.SUEDE_TEXTURE_CONFIG = { ...defaults };
        }
    } catch (_) {
        window.SUEDE_TEXTURE_CONFIG = { ...defaults };
    }
})();
</script>
HTML;

ob_start();
?>

<div class="container py-4">
    <div class="row g-4">
        <div class="col-12 col-lg-5">
            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <h4 class="card-title mb-3">Suede Texture Controls</h4>
                    <p class="text-muted mb-4">Adjust texture settings and apply them to the full page background.</p>

                    <div class="mb-3">
                        <label for="presetSelect" class="form-label">Preset</label>
                        <select id="presetSelect" class="form-select">
                            <option value="default">Default</option>
                            <option value="charcoal">Dark Charcoal</option>
                            <option value="warm">Warm Brown</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="grainBaseInput" class="form-label">Grain Base</label>
                        <input id="grainBaseInput" class="form-control" type="number" min="0" max="255" step="1">
                    </div>

                    <div class="mb-3">
                        <label for="grainRangeInput" class="form-label">Grain Range</label>
                        <input id="grainRangeInput" class="form-control" type="number" min="0" max="120" step="1">
                    </div>

                    <div class="mb-3">
                        <label for="toneRedInput" class="form-label">Tone Shift Red</label>
                        <input id="toneRedInput" class="form-control" type="number" min="-100" max="100" step="1">
                    </div>

                    <div class="mb-3">
                        <label for="toneGreenInput" class="form-label">Tone Shift Green</label>
                        <input id="toneGreenInput" class="form-control" type="number" min="-100" max="100" step="1">
                    </div>

                    <div class="mb-3">
                        <label for="toneBlueInput" class="form-label">Tone Shift Blue</label>
                        <input id="toneBlueInput" class="form-control" type="number" min="-100" max="100" step="1">
                    </div>

                    <div class="mb-3">
                        <label for="minTextureSizeInput" class="form-label">Min Texture Size</label>
                        <input id="minTextureSizeInput" class="form-control" type="number" min="512" max="8192" step="256">
                    </div>

                    <div class="mb-3">
                        <label for="overscanInput" class="form-label">Overscan Multiplier</label>
                        <input id="overscanInput" class="form-control" type="number" min="1" max="4" step="0.25">
                    </div>

                    <div class="mb-3">
                        <label for="renderScaleInput" class="form-label">Render Scale</label>
                        <input id="renderScaleInput" class="form-control" type="number" min="0.125" max="1" step="0.125">
                    </div>

                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="tileEnabledInput">
                        <label class="form-check-label" for="tileEnabledInput">Enable Seamless Tile Mode</label>
                    </div>

                    <div class="mb-3">
                        <label for="tileSizeInput" class="form-label">Tile Size</label>
                        <input id="tileSizeInput" class="form-control" type="number" min="256" max="2048" step="64">
                    </div>

                    <div class="mb-3">
                        <label for="grainScaleInput" class="form-label">Grain Scale</label>
                        <input id="grainScaleInput" class="form-control" type="number" min="0.5" max="16" step="0.5">
                    </div>

                    <div class="mb-3">
                        <label for="alphaInput" class="form-label">Alpha</label>
                        <input id="alphaInput" class="form-control" type="number" min="0" max="255" step="1">
                    </div>

                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="perlinEnabledInput">
                        <label class="form-check-label" for="perlinEnabledInput">Enable Perlin Layer</label>
                    </div>

                    <div class="mb-3">
                        <label for="perlinScaleInput" class="form-label">Perlin Scale</label>
                        <input id="perlinScaleInput" class="form-control" type="number" min="2" max="512" step="1">
                    </div>

                    <div class="mb-3">
                        <label for="perlinStrengthInput" class="form-label">Perlin Strength</label>
                        <input id="perlinStrengthInput" class="form-control" type="number" min="0" max="64" step="1">
                    </div>

                    <div class="mb-3">
                        <label for="perlinOctavesInput" class="form-label">Perlin Octaves</label>
                        <input id="perlinOctavesInput" class="form-control" type="number" min="1" max="6" step="1">
                    </div>

                    <div class="d-flex gap-2">
                        <button id="applyTextureConfigBtn" class="btn btn-primary">Apply (Reload)</button>
                        <button id="resetTextureConfigBtn" class="btn btn-outline-secondary">Reset</button>
                    </div>

                    <p class="small text-muted mt-3 mb-0">Tip: This demo stores settings in localStorage key <strong>suedeTextureConfig</strong>.</p>
                </div>
            </div>
        </div>

        <div class="col-12 col-lg-7">
            <div class="card shadow-sm border-0 mb-3" style="background-color: rgba(255,255,255,0.6); backdrop-filter: blur(1px);">
                <div class="card-body">
                    <h4 class="card-title">Capabilities Preview</h4>
                    <ul class="mb-0">
                        <li>Full-page body texture generation</li>
                        <li>Large cached texture map</li>
                        <li>Scroll updates using background positioning only</li>
                        <li>Regeneration only when viewport needs a larger texture</li>
                    </ul>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-12 col-md-6">
                    <div class="p-4 rounded border" style="background-color: rgba(30,30,30,0.35); color: #fff; min-height: 170px;">
                        <h5>Dark Overlay Card</h5>
                        <p class="mb-0">Useful to verify contrast and texture visibility under dark translucent surfaces.</p>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="p-4 rounded border" style="background-color: rgba(255,255,255,0.35); min-height: 170px;">
                        <h5>Light Overlay Card</h5>
                        <p class="mb-0">Useful to verify texture detail under bright translucent surfaces.</p>
                    </div>
                </div>
                <div class="col-12">
                    <div class="p-4 rounded border" style="background: linear-gradient(145deg, rgba(255,255,255,0.45), rgba(10,10,10,0.25)); min-height: 200px;">
                        <h5>Gradient Overlay</h5>
                        <p class="mb-0">Scroll the page to verify the texture remains stable and performant.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div style="height: 60vh;"></div>
</div>

<script>
(function () {
    const defaults = {
        minTextureSize: 2048,
        maxTextureSize: 4096,
        overscanMultiplier: 2,
        renderScale: 0.5,
        tileEnabled: true,
        tileSize: 1024,
        grainScale: 2,
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

    const presets = {
        default: { ...defaults },
        charcoal: {
            ...defaults,
            renderScale: 0.375,
            grainBase: 60,
            grainRange: 22,
            grainScale: 1.5,
            toneShiftRed: 0,
            toneShiftGreen: 0,
            toneShiftBlue: -4,
            perlinEnabled: true,
            perlinStrength: 10,
            perlinScale: 128
        },
        warm: {
            ...defaults,
            renderScale: 0.5,
            grainBase: 105,
            grainRange: 26,
            grainScale: 2.5,
            toneShiftRed: 18,
            toneShiftGreen: 8,
            toneShiftBlue: -6,
            perlinEnabled: true,
            perlinStrength: 12,
            perlinScale: 90
        }
    };

    const fields = {
        grainBase: document.getElementById('grainBaseInput'),
        grainRange: document.getElementById('grainRangeInput'),
        toneShiftRed: document.getElementById('toneRedInput'),
        toneShiftGreen: document.getElementById('toneGreenInput'),
        toneShiftBlue: document.getElementById('toneBlueInput'),
        minTextureSize: document.getElementById('minTextureSizeInput'),
        overscanMultiplier: document.getElementById('overscanInput'),
        renderScale: document.getElementById('renderScaleInput'),
        tileSize: document.getElementById('tileSizeInput'),
        grainScale: document.getElementById('grainScaleInput'),
        alpha: document.getElementById('alphaInput'),
        perlinScale: document.getElementById('perlinScaleInput'),
        perlinStrength: document.getElementById('perlinStrengthInput'),
        perlinOctaves: document.getElementById('perlinOctavesInput')
    };

    const perlinEnabledInput = document.getElementById('perlinEnabledInput');
    const tileEnabledInput = document.getElementById('tileEnabledInput');

    function getCurrentConfig() {
        let stored = {};
        try {
            stored = JSON.parse(localStorage.getItem('suedeTextureConfig') || '{}');
        } catch (_) {
            stored = {};
        }

        return { ...defaults, ...stored, ...(window.SUEDE_TEXTURE_CONFIG || {}) };
    }

    function fillForm(config) {
        Object.entries(fields).forEach(([key, input]) => {
            input.value = config[key];
        });
        perlinEnabledInput.checked = Boolean(config.perlinEnabled);
        tileEnabledInput.checked = Boolean(config.tileEnabled);
    }

    function readForm() {
        return {
            grainBase: Number(fields.grainBase.value),
            grainRange: Number(fields.grainRange.value),
            renderScale: Number(fields.renderScale.value),
            tileEnabled: tileEnabledInput.checked,
            tileSize: Number(fields.tileSize.value),
            grainScale: Number(fields.grainScale.value),
            toneShiftRed: Number(fields.toneShiftRed.value),
            toneShiftGreen: Number(fields.toneShiftGreen.value),
            toneShiftBlue: Number(fields.toneShiftBlue.value),
            minTextureSize: Number(fields.minTextureSize.value),
            maxTextureSize: defaults.maxTextureSize,
            overscanMultiplier: Number(fields.overscanMultiplier.value),
            alpha: Number(fields.alpha.value),
            perlinEnabled: perlinEnabledInput.checked,
            perlinScale: Number(fields.perlinScale.value),
            perlinStrength: Number(fields.perlinStrength.value),
            perlinOctaves: Number(fields.perlinOctaves.value),
            perlinPersistence: defaults.perlinPersistence,
            perlinLacunarity: defaults.perlinLacunarity,
            perlinSeed: defaults.perlinSeed
        };
    }

    const presetSelect = document.getElementById('presetSelect');
    const applyBtn = document.getElementById('applyTextureConfigBtn');
    const resetBtn = document.getElementById('resetTextureConfigBtn');

    fillForm(getCurrentConfig());

    presetSelect.addEventListener('change', () => {
        const selected = presets[presetSelect.value] || defaults;
        fillForm(selected);
    });

    applyBtn.addEventListener('click', () => {
        const config = readForm();
        localStorage.setItem('suedeTextureConfig', JSON.stringify(config));
        window.location.reload();
    });

    resetBtn.addEventListener('click', () => {
        localStorage.removeItem('suedeTextureConfig');
        fillForm(defaults);
        window.location.reload();
    });
})();
</script>

<?php
$content = ob_get_clean();
require __DIR__ . '/../layouts/template.php';
