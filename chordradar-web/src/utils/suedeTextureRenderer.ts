type SuedeConfig = {
    minTextureSize: number;
    maxTextureSize: number;
    overscanMultiplier: number;
    renderScale: number;
    tileEnabled: boolean;
    tileSize: number;
    grainScale: number;
    grainBase: number;
    grainRange: number;
    toneShiftRed: number;
    toneShiftGreen: number;
    toneShiftBlue: number;
    alpha: number;
};

  type ThemeMode = "light" | "dark";

  type SuedeApi = {
    isLoaded: boolean;
    regenerate: (nextConfig?: Partial<SuedeConfig>) => void;
    getConfig: () => SuedeConfig;
  };

declare global {
    interface Window {
        SUEDE_TEXTURE_CONFIG?: Partial<SuedeConfig>;
        SuedeTextureRenderer?: SuedeApi;
        __suedeTextureInitialized?: boolean;
    }
}

const DEFAULT_CONFIG: SuedeConfig = {
    minTextureSize: 2048,
    maxTextureSize: 4096,
    overscanMultiplier: 2,
    renderScale: 1,
    tileEnabled: true,
    tileSize: 512,
    grainScale: 1,
    grainBase: 50,
    grainRange: 30,
    toneShiftRed: 10,
    toneShiftGreen: 5,
    toneShiftBlue: 0,
    alpha: 255,
};

  const LIGHT_THEME_CONFIG: Partial<SuedeConfig> = {
    grainBase: 220,
    grainRange: 18,
    toneShiftRed: 4,
    toneShiftGreen: 2,
    toneShiftBlue: 0,
    alpha: 255,
  };

  const DARK_THEME_CONFIG: Partial<SuedeConfig> = {
    grainBase: 50,
    grainRange: 30,
    toneShiftRed: 10,
    toneShiftGreen: 5,
    toneShiftBlue: 0,
    alpha: 255,
  };

const NOISE_SEED = 1337;

export function startSuedeTextureRenderer() {
    if (window.__suedeTextureInitialized) return;
    window.__suedeTextureInitialized = true;

    let userConfig: Partial<SuedeConfig> = { ...(window.SUEDE_TEXTURE_CONFIG || {}) };
    let currentTheme: ThemeMode = "dark";
    let currentConfig: SuedeConfig = { ...DEFAULT_CONFIG };
    const MAX_TEXTURE_PIXELS = 16777216;

    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const cache = {
        width: 0,
        height: 0,
        sourceWidth: 0,
        sourceHeight: 0,
        dataUrl: "",
    };

    function getNumber(value: unknown, fallback: number) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function getThemeMode(): ThemeMode {
      const htmlTheme = document.documentElement.getAttribute("data-theme");
      const bootstrapTheme = document.documentElement.getAttribute("data-bs-theme");

      if (htmlTheme === "light" || bootstrapTheme === "light") {
        return "light";
      }

      if (htmlTheme === "dark" || bootstrapTheme === "dark") {
        return "dark";
      }

      return colorSchemeQuery.matches ? "dark" : "light";
    }

    function getThemeConfig(theme: ThemeMode): Partial<SuedeConfig> {
      return theme === "light" ? LIGHT_THEME_CONFIG : DARK_THEME_CONFIG;
    }

    function rebuildConfig(saveToGlobal = true) {
      currentConfig = {
        ...DEFAULT_CONFIG,
        ...getThemeConfig(currentTheme),
        ...userConfig,
      };

        if (saveToGlobal) {
            window.SUEDE_TEXTURE_CONFIG = { ...currentConfig };
        }
    }

    function applyConfig(nextConfig: Partial<SuedeConfig> = {}, saveToGlobal = true) {
      userConfig = {
        ...userConfig,
        ...nextConfig,
      };
      rebuildConfig(saveToGlobal);
    }

    function syncThemeFromEnvironment() {
      const nextTheme = getThemeMode();
      if (nextTheme === currentTheme) {
        return false;
      }

      currentTheme = nextTheme;
      rebuildConfig(false);
      return true;
    }

    function ceilPowerOfTwo(value: number) {
        return Math.pow(2, Math.ceil(Math.log2(Math.max(1, value))));
    }

    function getTargetTextureSize() {
        const tileEnabled = Boolean(currentConfig.tileEnabled);
        if (tileEnabled) {
            return {
                width: Math.max(256, Math.min(2048, getNumber(currentConfig.tileSize, DEFAULT_CONFIG.tileSize))),
                height: Math.max(256, Math.min(2048, getNumber(currentConfig.tileSize, DEFAULT_CONFIG.tileSize))),
            };
        }

        const minTextureSize = Math.max(512, getNumber(currentConfig.minTextureSize, DEFAULT_CONFIG.minTextureSize));
        const maxTextureSize = Math.max(minTextureSize, getNumber(currentConfig.maxTextureSize, DEFAULT_CONFIG.maxTextureSize));
        const overscanMultiplier = Math.min(3, Math.max(1, getNumber(currentConfig.overscanMultiplier, DEFAULT_CONFIG.overscanMultiplier)));

        const documentHeight = Math.max(
            window.innerHeight,
            document.documentElement?.scrollHeight || 0,
            document.body?.scrollHeight || 0,
        );

        let width = Math.max(minTextureSize, ceilPowerOfTwo(window.innerWidth * overscanMultiplier));
        let height = Math.max(minTextureSize, ceilPowerOfTwo(documentHeight));

        width = Math.min(maxTextureSize, width);
        height = Math.min(maxTextureSize, height);

        const pixels = width * height;
        if (pixels > MAX_TEXTURE_PIXELS) {
            const ratio = Math.sqrt(MAX_TEXTURE_PIXELS / pixels);
            width = Math.max(512, Math.floor(width * ratio));
            height = Math.max(512, Math.floor(height * ratio));
        }

        return { width, height };
    }

    function wrapIndex(value: number, period: number) {
      if (period <= 0) return value;
      return ((value % period) + period) % period;
    }

    function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t;
    }

    function fade(t: number) {
        return t * t * (3 - 2 * t);
    }

    function hash2D(x: number, y: number) {
      let n = x * 374761393 + y * 668265263 + NOISE_SEED * 69069;
        n = (n ^ (n >> 13)) * 1274126177;
        n = n ^ (n >> 16);
        return (n >>> 0) / 4294967295;
    }

    function valueNoise2DPeriodic(x: number, y: number, periodX: number, periodY: number) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const sx = fade(x - x0);
        const sy = fade(y - y0);

        const wrappedX0 = wrapIndex(x0, periodX);
        const wrappedY0 = wrapIndex(y0, periodY);
        const wrappedX1 = wrapIndex(x1, periodX);
        const wrappedY1 = wrapIndex(y1, periodY);

        const n00 = hash2D(wrappedX0, wrappedY0) * 2 - 1;
        const n10 = hash2D(wrappedX1, wrappedY0) * 2 - 1;
        const n01 = hash2D(wrappedX0, wrappedY1) * 2 - 1;
        const n11 = hash2D(wrappedX1, wrappedY1) * 2 - 1;

        const nx0 = lerp(n00, n10, sx);
        const nx1 = lerp(n01, n11, sx);
        return lerp(nx0, nx1, sy);
    }

    function sealTileEdges(context: CanvasRenderingContext2D, width: number, height: number) {
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

    function generateTexture(width: number, height: number) {
      const sourceCanvas = document.createElement("canvas");
      const context = sourceCanvas.getContext("2d");

      if (!context) return false;

      const renderScale = Math.min(1, Math.max(0.125, getNumber(currentConfig.renderScale, DEFAULT_CONFIG.renderScale)));
      const tileEnabled = Boolean(currentConfig.tileEnabled);

      const sourceWidth = tileEnabled ? width : Math.max(256, Math.floor(width * renderScale));
      const sourceHeight = tileEnabled ? height : Math.max(256, Math.floor(height * renderScale));

      sourceCanvas.width = sourceWidth;
      sourceCanvas.height = sourceHeight;

      const imageData = context.createImageData(sourceWidth, sourceHeight);
      const data = imageData.data;

      const grainScale = Math.max(0.5, getNumber(currentConfig.grainScale, DEFAULT_CONFIG.grainScale));

      const grainPeriodX = Math.max(1, Math.round(width / grainScale));
      const grainPeriodY = Math.max(1, Math.round(height / grainScale));

      const grainBase = getNumber(currentConfig.grainBase, DEFAULT_CONFIG.grainBase);
      const grainRange = Math.max(0, getNumber(currentConfig.grainRange, DEFAULT_CONFIG.grainRange));
      const toneShiftRed = getNumber(currentConfig.toneShiftRed, DEFAULT_CONFIG.toneShiftRed);
      const toneShiftGreen = getNumber(currentConfig.toneShiftGreen, DEFAULT_CONFIG.toneShiftGreen);
      const toneShiftBlue = getNumber(currentConfig.toneShiftBlue, DEFAULT_CONFIG.toneShiftBlue);
      const alpha = Math.max(0, Math.min(255, getNumber(currentConfig.alpha, DEFAULT_CONFIG.alpha)));

      for (let y = 0; y < sourceHeight; y++) {
        for (let x = 0; x < sourceWidth; x++) {
          const index = (y * sourceWidth + x) * 4;
          const sampleX = x / renderScale;
          const sampleY = y / renderScale;

          const grainNoise = tileEnabled
            ? valueNoise2DPeriodic(sampleX / grainScale, sampleY / grainScale, grainPeriodX, grainPeriodY)
            : hash2D(Math.floor(sampleX), Math.floor(sampleY)) * 2 - 1;

          const grain = grainBase + ((grainNoise + 1) * 0.5 * grainRange);

          data[index] = Math.max(0, Math.min(255, grain + toneShiftRed));
          data[index + 1] = Math.max(0, Math.min(255, grain + toneShiftGreen));
          data[index + 2] = Math.max(0, Math.min(255, grain + toneShiftBlue));
          data[index + 3] = alpha;
        }
      }

      context.putImageData(imageData, 0, 0);

      let outputCanvas = sourceCanvas;

      if (tileEnabled) {
        sealTileEdges(context, width, height);
      } else if (sourceWidth !== width || sourceHeight !== height) {
        outputCanvas = document.createElement("canvas");
        outputCanvas.width = width;
        outputCanvas.height = height;

        const outputContext = outputCanvas.getContext("2d");
        if (!outputContext) return false;

        outputContext.imageSmoothingEnabled = true;
        outputContext.drawImage(sourceCanvas, 0, 0, width, height);
      }

      cache.width = width;
      cache.height = height;
      cache.sourceWidth = sourceWidth;
      cache.sourceHeight = sourceHeight;
      cache.dataUrl = outputCanvas.toDataURL("image/png");

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
      } catch {
        generated = false;
      }

      if (generated) return;

      const fallbackWidth = Math.max(512, Math.floor(width / 2));
      const fallbackHeight = Math.max(512, Math.floor(height / 2));

      try {
        generateTexture(fallbackWidth, fallbackHeight);
      } catch {
        cache.width = 0;
        cache.height = 0;
        cache.sourceWidth = 0;
        cache.sourceHeight = 0;
        cache.dataUrl = "";
      }
    }

    function applyTextureStyles(target: HTMLElement) {
      if (!cache.dataUrl) return;

      const tileEnabled = Boolean(currentConfig.tileEnabled);

      target.style.setProperty("background-image", `url(${cache.dataUrl})`, "important");
      target.style.setProperty("background-repeat", tileEnabled ? "repeat" : "no-repeat", "important");
      target.style.setProperty("background-size", `${cache.width}px ${cache.height}px`, "important");
      target.style.setProperty("background-attachment", "scroll", "important");
      target.style.setProperty("background-position", "0 0", "important");
    }

    function applyTextureToPage() {
      const html = document.documentElement;
      const body = document.body;
      if (!html || !body || !cache.dataUrl) return;

      applyTextureStyles(html);
      html.style.setProperty("background-color", currentTheme === "light" ? "rgb(236, 239, 244)" : "rgb(18, 19, 24)", "important");

      body.style.removeProperty("background-image");
      body.style.removeProperty("background-repeat");
      body.style.removeProperty("background-size");
      body.style.removeProperty("background-attachment");
      body.style.removeProperty("background-position");
      body.style.setProperty("background-color", "transparent", "important");
    }

    function renderTexture(force = false) {
      ensureTextureForViewport(force);
      applyTextureToPage();
    }

    function regenerate(nextConfig?: Partial<SuedeConfig>) {
      if (nextConfig) {
        applyConfig(nextConfig);
        try {
          localStorage.setItem("suedeTextureConfig", JSON.stringify(window.SUEDE_TEXTURE_CONFIG));
        } catch {
          // Ignore storage errors
        }
      }

      cache.width = 0;
      cache.height = 0;
      cache.sourceWidth = 0;
      cache.sourceHeight = 0;
      cache.dataUrl = "";

      renderTexture(true);
    }

    window.SuedeTextureRenderer = {
      isLoaded: true,
      regenerate,
      getConfig: () => ({ ...currentConfig }),
    };

    currentTheme = getThemeMode();
    rebuildConfig(true);
    renderTexture(true);
    window.addEventListener("resize", () => renderTexture(false));

    const onThemeQueryChange = () => {
      if (syncThemeFromEnvironment()) {
        regenerate();
      }
    };

    if (typeof colorSchemeQuery.addEventListener === "function") {
      colorSchemeQuery.addEventListener("change", onThemeQueryChange);
    } else if (typeof colorSchemeQuery.addListener === "function") {
      colorSchemeQuery.addListener(onThemeQueryChange);
    }

    const mutationObserver = new MutationObserver(() => {
      if (syncThemeFromEnvironment()) {
        regenerate();
        return;
      }

      applyTextureToPage();
    });

    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-bs-theme"],
    });

    if (document.body) {
      mutationObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }
}

export default startSuedeTextureRenderer;
