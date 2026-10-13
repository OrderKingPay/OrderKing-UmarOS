/**
 * UMAR OS - Vector Intelligence & Multi-modal Graphics Engine
 * High-performance SVG Vector Generator, Color Harmonizer, and Security Sanitizer.
 */

export type VectorAspectRatio = '1:1' | '16:9' | '9:16';
export type EmblemType = 'crown' | 'shield' | 'zap' | 'utensils' | 'Crown' | 'Shield' | 'Zap' | 'Utensils';
export type VectorTheme = 'dark' | 'light' | 'neon' | 'cyber';

export interface AspectRatioConfig {
  width: number;
  height: number;
  viewBox: string;
  aspectRatio: VectorAspectRatio;
}

export interface RGB {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

export interface HSL {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

export interface ColorPalette {
  primary: string;
  complementary: string;
  triadic: [string, string, string];
  analogous: [string, string, string];
  accent: string;
  background: string;
  surface: string;
  glow: string;
}

export interface VectorGenerationOptions {
  aspectRatio?: VectorAspectRatio;
  width?: number;
  height?: number;
  baseColor?: string;
  emblem?: EmblemType;
  title?: string;
  subtitle?: string;
  theme?: VectorTheme;
  glowIntensity?: number;
  showAmbientGlow?: boolean;
  showDropShadow?: boolean;
  showRadialGradients?: boolean;
  idPrefix?: string;
  scale?: number;
  sanitize?: boolean;
  metadata?: Record<string, string>;
  customDefs?: string;
  customChildren?: string;
}

export const ASPECT_RATIO_CONFIGS: Record<VectorAspectRatio, AspectRatioConfig> = {
  '1:1': {
    width: 1080,
    height: 1080,
    viewBox: '0 0 1080 1080',
    aspectRatio: '1:1',
  },
  '16:9': {
    width: 1920,
    height: 1080,
    viewBox: '0 0 1920 1080',
    aspectRatio: '16:9',
  },
  '9:16': {
    width: 1080,
    height: 1920,
    viewBox: '0 0 1080 1920',
    aspectRatio: '9:16',
  },
};

/**
 * Returns dimensions and viewBox configuration for a supported aspect ratio.
 */
export function getDimensionsForAspectRatio(aspectRatio: VectorAspectRatio): AspectRatioConfig {
  const config = ASPECT_RATIO_CONFIGS[aspectRatio];
  if (!config) {
    throw new Error(`Unsupported aspect ratio: "${aspectRatio}". Supported ratios are 1:1, 16:9, 9:16.`);
  }
  return { ...config };
}

/**
 * Parses a 3-character or 6-character hex color code into RGB components.
 */
export function parseHexColor(hex: string): RGB {
  let cleaned = hex.trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    throw new Error(`Invalid hex color: "${hex}". Expected format #RGB or #RRGGBB.`);
  }
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

/**
 * Converts RGB components to a normalized uppercase 6-character hex color string.
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Converts RGB components to HSL.
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / delta + 2) * 60;
        break;
      case b:
        h = ((r - g) / delta + 4) * 60;
        break;
    }
  }

  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL components to RGB.
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, hsl.s)) / 100;
  const l = Math.max(0, Math.min(100, hsl.l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else if (h >= 300 && h < 360) {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

/**
 * Converts HSL components directly to an uppercase hex color string.
 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Computes the 180-degree complementary color for a given hex color.
 */
export function computeComplementaryColor(baseHex: string): string {
  const rgb = parseHexColor(baseHex);
  const hsl = rgbToHsl(rgb);
  const complementaryHsl: HSL = {
    h: (hsl.h + 180) % 360,
    s: hsl.s,
    l: hsl.l,
  };
  return hslToHex(complementaryHsl);
}

/**
 * Computes the triadic color triad [base, +120deg, +240deg] for a given hex color.
 */
export function computeTriadicColors(baseHex: string): [string, string, string] {
  const rgb = parseHexColor(baseHex);
  const normalizedBase = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);

  const triad1: HSL = {
    h: (hsl.h + 120) % 360,
    s: hsl.s,
    l: hsl.l,
  };
  const triad2: HSL = {
    h: (hsl.h + 240) % 360,
    s: hsl.s,
    l: hsl.l,
  };

  return [normalizedBase, hslToHex(triad1), hslToHex(triad2)];
}

/**
 * Computes a comprehensive harmonious color palette including complementary,
 * triadic, analogous, glow, background, and surface tones.
 */
export function computeColorPalette(baseHex: string, options?: { mode?: 'dark' | 'light' }): ColorPalette {
  const rgb = parseHexColor(baseHex);
  const primary = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const complementary = computeComplementaryColor(baseHex);
  const triadic = computeTriadicColors(baseHex);

  const analogous1 = hslToHex({ h: (hsl.h + 330) % 360, s: hsl.s, l: hsl.l });
  const analogous2 = hslToHex({ h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l });

  const isDark = options?.mode !== 'light';

  const background = isDark
    ? hslToHex({ h: hsl.h, s: Math.min(30, hsl.s), l: 7 })
    : hslToHex({ h: hsl.h, s: Math.min(20, hsl.s), l: 96 });

  const surface = isDark
    ? hslToHex({ h: hsl.h, s: Math.min(25, hsl.s), l: 15 })
    : hslToHex({ h: hsl.h, s: Math.min(15, hsl.s), l: 90 });

  const glow = hslToHex({ h: hsl.h, s: Math.min(100, Math.max(70, hsl.s)), l: 60 });
  const accent = triadic[1];

  return {
    primary,
    complementary,
    triadic,
    analogous: [analogous1, primary, analogous2],
    accent,
    background,
    surface,
    glow,
  };
}

/**
 * XML escape utility for strings injected into SVG text nodes.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Renders vector geometry for a supported emblem (Crown, Shield, Zap, Utensils).
 */
export function renderEmblemPath(
  emblem: EmblemType,
  primaryColor: string,
  accentColor: string,
  idPrefix: string
): string {
  const normalized = emblem.toLowerCase();

  switch (normalized) {
    case 'crown':
      return `
    <g id="${idPrefix}emblem-crown">
      <!-- Crown Body & Peaks -->
      <path d="M -100,45 L -120,-30 L -50,15 L 0,-85 L 50,15 L 120,-30 L 100,45 Z"
            fill="url(#${idPrefix}emblem-grad)"
            stroke="${primaryColor}"
            stroke-width="4"
            stroke-linejoin="round" />
      <!-- Inner Crown Cutout Accent -->
      <path d="M -80,40 L -95,-10 L -45,18 L 0,-50 L 45,18 L 95,-10 L 80,40 Z"
            fill="${accentColor}"
            fill-opacity="0.28"
            stroke="${accentColor}"
            stroke-width="2" />
      <!-- Peak Jewels -->
      <circle cx="-120" cy="-30" r="9" fill="${accentColor}" stroke="#FFFFFF" stroke-width="2" />
      <circle cx="0" cy="-85" r="12" fill="${accentColor}" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="120" cy="-30" r="9" fill="${accentColor}" stroke="#FFFFFF" stroke-width="2" />
      <circle cx="-50" cy="15" r="7" fill="${primaryColor}" stroke="#FFFFFF" stroke-width="1.5" />
      <circle cx="50" cy="15" r="7" fill="${primaryColor}" stroke="#FFFFFF" stroke-width="1.5" />
      <!-- Regal Base Band -->
      <rect x="-105" y="55" width="210" height="26" rx="6" fill="url(#${idPrefix}emblem-grad)" stroke="${primaryColor}" stroke-width="3" />
      <circle cx="-70" cy="68" r="5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="-35" cy="68" r="6" fill="${accentColor}" />
      <circle cx="0" cy="68" r="7" fill="#FFFFFF" />
      <circle cx="35" cy="68" r="6" fill="${accentColor}" />
      <circle cx="70" cy="68" r="5" fill="#FFFFFF" opacity="0.9" />
    </g>`;

    case 'shield':
      return `
    <g id="${idPrefix}emblem-shield">
      <!-- Outer Shield Crest -->
      <path d="M 0,-120 C 65,-120 115,-90 115,-25 C 115,65 55,115 0,145 C -55,115 -115,65 -115,-25 C -115,-90 -65,-120 0,-120 Z"
            fill="url(#${idPrefix}emblem-grad)"
            stroke="${primaryColor}"
            stroke-width="5"
            stroke-linejoin="round" />
      <!-- Inner Shield Inset -->
      <path d="M 0,-102 C 52,-102 92,-76 92,-20 C 92,54 44,96 0,122 C -44,96 -92,54 -92,-20 C -92,-76 -52,-102 0,-102 Z"
            fill="${accentColor}"
            fill-opacity="0.25"
            stroke="${accentColor}"
            stroke-width="3" />
      <!-- Central Heraldic Cross -->
      <path d="M -8,-65 L 8,-65 L 8,75 L -8,75 Z" fill="#FFFFFF" opacity="0.85" />
      <path d="M -60,-15 L 60,-15 L 60,1 L -60,1 Z" fill="#FFFFFF" opacity="0.85" />
      <!-- Center Core Star -->
      <polygon points="0,-25 7,-9 24,-9 10,2 15,18 0,8 -15,18 -10,2 -24,-9 -7,-9" fill="${primaryColor}" stroke="#FFFFFF" stroke-width="1.5" />
    </g>`;

    case 'zap':
      return `
    <g id="${idPrefix}emblem-zap">
      <!-- Outer Lightning Bolt -->
      <polygon points="18,-135 -75,-8 -8,-8 -48,135 75,5 8,5 48,-135"
               fill="url(#${idPrefix}emblem-grad)"
               stroke="${primaryColor}"
               stroke-width="4"
               stroke-linejoin="round" />
      <!-- Inner High-Voltage Core -->
      <polygon points="12,-105 -50,-14 -2,-14 -30,95 50,-2 2,-2 32,-105"
               fill="${accentColor}"
               opacity="0.8" />
      <polygon points="7,-75 -25,-18 2,-18 -12,60 25,-8 2,-8 17,-75"
               fill="#FFFFFF"
               opacity="0.95" />
    </g>`;

    case 'utensils':
      return `
    <g id="${idPrefix}emblem-utensils">
      <!-- Culinary Concentric Halos -->
      <circle cx="0" cy="0" r="115" fill="none" stroke="${primaryColor}" stroke-width="3" stroke-dasharray="8 6" opacity="0.6" />
      <circle cx="0" cy="0" r="100" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.8" />
      <!-- Crossed Fork -->
      <g transform="rotate(-35)">
        <rect x="-6" y="10" width="12" height="100" rx="5" fill="url(#${idPrefix}emblem-grad)" stroke="${primaryColor}" stroke-width="2" />
        <path d="M -22,-20 C -22,10 -10,12 0,12 C 10,12 22,10 22,-20 Z" fill="url(#${idPrefix}emblem-grad)" stroke="${primaryColor}" stroke-width="2" />
        <rect x="-22" y="-95" width="6" height="78" rx="3" fill="#FFFFFF" opacity="0.95" />
        <rect x="-9" y="-98" width="6" height="81" rx="3" fill="#FFFFFF" opacity="0.95" />
        <rect x="3" y="-98" width="6" height="81" rx="3" fill="#FFFFFF" opacity="0.95" />
        <rect x="16" y="-95" width="6" height="78" rx="3" fill="#FFFFFF" opacity="0.95" />
      </g>
      <!-- Crossed Knife -->
      <g transform="rotate(35)">
        <rect x="-6" y="10" width="12" height="100" rx="5" fill="url(#${idPrefix}emblem-grad)" stroke="${primaryColor}" stroke-width="2" />
        <path d="M -6,10 L -6,-100 C 18,-85 24,-20 6,10 Z" fill="#FFFFFF" opacity="0.92" stroke="${primaryColor}" stroke-width="2" />
      </g>
      <!-- Center Platter Accent Jewel -->
      <circle cx="0" cy="0" r="14" fill="${accentColor}" stroke="#FFFFFF" stroke-width="3" />
    </g>`;

    default:
      throw new Error(`Unsupported emblem: "${emblem}". Supported emblems are: crown, shield, zap, utensils.`);
  }
}

/**
 * High-performance, zero-dependency SVG security sanitizer.
 * Neutralizes XSS vectors, malicious script blocks, dangerous foreign tags,
 * event handlers, XXE doctypes, and unsafe URL schemes.
 */
export function sanitizeSvg(svgMarkup: string): string {
  if (!svgMarkup || typeof svgMarkup !== 'string') {
    return '';
  }

  let sanitized = svgMarkup;

  // 1. Remove XML DOCTYPE and ENTITY declarations (XXE protection)
  sanitized = sanitized.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  sanitized = sanitized.replace(/<!ENTITY[\s\S]*?>/gi, '');

  // 2. Loop to strip dangerous nested tags (script, iframe, object, embed, foreignObject, etc.)
  const dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'foreignobject',
    'meta',
    'link',
    'base',
    'applet',
    'audio',
    'video',
    'form',
    'input',
    'button',
    'textarea',
    'select',
  ];

  let prev = '';
  while (prev !== sanitized) {
    prev = sanitized;
    for (const tag of dangerousTags) {
      // Strips paired tags <tag>...</tag>
      const pairedRegex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
      sanitized = sanitized.replace(pairedRegex, '');
      // Strips self-closing <tag ... />
      const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
      sanitized = sanitized.replace(selfClosingRegex, '');
    }
  }

  // 3. Remove inline event handlers (onload, onclick, onerror, onmouseover, etc.)
  sanitized = sanitized.replace(/\s+on[a-zA-Z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 4. Remove dangerous URI schemes in href, xlink:href, src, formaction, etc.
  sanitized = sanitized.replace(
    /\s+(?:href|xlink:href|src|action|formaction)\s*=\s*(["'])\s*(?:javascript|vbscript|data:(?!image\/(?:png|jpe?g|gif|webp|svg\+xml)))[\s\S]*?\1/gi,
    ''
  );

  // 5. Remove dangerous CSS expressions and scripts in style attributes
  sanitized = sanitized.replace(/\s+style\s*=\s*(["'])[\s\S]*?\1/gi, (match) => {
    if (
      /expression\s*\(|javascript\s*:|url\s*\(\s*["']?\s*javascript|behavior\s*:|@import/i.test(
        match
      )
    ) {
      return '';
    }
    return match;
  });

  return sanitized.trim();
}

/**
 * Checks whether an SVG string is safe according to the vector security policy.
 */
export function isSvgSafe(svgMarkup: string): boolean {
  if (!svgMarkup || typeof svgMarkup !== 'string') return false;

  // Check for dangerous tags
  if (/<(script|iframe|object|embed|foreignobject|meta|link|base|applet)\b/i.test(svgMarkup)) {
    return false;
  }

  // Check for event handlers
  if (/\son[a-zA-Z0-9_-]+\s*=/i.test(svgMarkup)) {
    return false;
  }

  // Check for javascript / vbscript pseudo-protocols
  if (/(?:href|xlink:href|src)\s*=\s*["']\s*(?:javascript|vbscript):/i.test(svgMarkup)) {
    return false;
  }

  // Check for DOCTYPE / ENTITY
  if (/<!DOCTYPE|<!ENTITY/i.test(svgMarkup)) {
    return false;
  }

  return true;
}

/**
 * Converts raw SVG markup to a data URI suitable for <img> sources or CSS backgrounds.
 */
export function svgToDataUri(svg: string, encoding: 'base64' | 'utf8' = 'base64'): string {
  if (encoding === 'base64') {
    const base64Content = Buffer.from(svg, 'utf-8').toString('base64');
    return `data:image/svg+xml;base64,${base64Content}`;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Core SVG Vector Generator.
 * Creates pristine SVG markup with embedded ambient glow, drop-shadow, radial gradients,
 * customizable emblem, and typography.
 */
export function generateSvg(options?: VectorGenerationOptions): string {
  const opts = options || {};
  const aspectRatio = opts.aspectRatio || '1:1';
  const dim = getDimensionsForAspectRatio(aspectRatio);

  const width = opts.width ?? dim.width;
  const height = opts.height ?? dim.height;
  const viewBox = dim.viewBox;

  const baseColor = opts.baseColor || '#4F46E5';
  const palette = computeColorPalette(baseColor, {
    mode: opts.theme === 'light' ? 'light' : 'dark',
  });

  const emblem = opts.emblem || 'crown';
  const idPrefix = opts.idPrefix ? `${opts.idPrefix}-` : 'ok-vec-';
  const scale = opts.scale ?? (aspectRatio === '1:1' ? 2.5 : aspectRatio === '16:9' ? 2.3 : 2.6);

  const cx = width / 2;
  const cy = height / 2;

  const showGlow = opts.showAmbientGlow !== false;
  const showShadow = opts.showDropShadow !== false;
  const showRadial = opts.showRadialGradients !== false;

  const emblemYOffset = opts.title ? -35 : 0;
  const emblemCenterY = cy + emblemYOffset;

  const emblemSvg = renderEmblemPath(emblem, palette.primary, palette.accent, idPrefix);

  const titleSvg = opts.title
    ? `
    <text x="${cx}" y="${emblemCenterY + 220}"
          text-anchor="middle"
          fill="#FFFFFF"
          font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          font-size="44"
          font-weight="700"
          letter-spacing="2"
          ${showShadow ? `filter="url(#${idPrefix}drop-shadow)"` : ''}>
      ${escapeXml(opts.title)}
    </text>`
    : '';

  const subtitleSvg = opts.subtitle
    ? `
    <text x="${cx}" y="${emblemCenterY + 270}"
          text-anchor="middle"
          fill="${palette.glow}"
          font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          font-size="24"
          font-weight="500"
          letter-spacing="1.5">
      ${escapeXml(opts.subtitle)}
    </text>`
    : '';

  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(opts.title || `${emblem} vector asset`)}">
  <defs>
    <!-- Ambient Glow Filter -->
    ${
      showGlow
        ? `<filter id="${idPrefix}ambient-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="22" result="blur1" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="45" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>`
        : ''
    }

    <!-- High-Fidelity Drop Shadow Filter -->
    ${
      showShadow
        ? `<filter id="${idPrefix}drop-shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="16" result="shadowBlur" />
      <feOffset in="shadowBlur" dx="0" dy="18" result="shadowOffset" />
      <feComponentTransfer in="shadowOffset" result="shadowAlpha">
        <feFuncA type="linear" slope="0.65" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="shadowAlpha" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>`
        : ''
    }

    <!-- Radial Background Gradient -->
    ${
      showRadial
        ? `<radialGradient id="${idPrefix}radial-bg" cx="50%" cy="50%" r="75%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.32" />
      <stop offset="55%" stop-color="${palette.surface}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${palette.background}" stop-opacity="1" />
    </radialGradient>`
        : ''
    }

    <!-- Radial Ambient Halo Gradient -->
    <radialGradient id="${idPrefix}radial-halo" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="${palette.primary}" stop-opacity="0.75" />
      <stop offset="65%" stop-color="${palette.glow}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${palette.background}" stop-opacity="0" />
    </radialGradient>

    <!-- Linear Metallic Emblem Gradient -->
    <linearGradient id="${idPrefix}emblem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.primary}" />
      <stop offset="50%" stop-color="${palette.glow}" />
      <stop offset="100%" stop-color="${palette.accent}" />
    </linearGradient>

    ${opts.customDefs || ''}
  </defs>

  <!-- Background Base -->
  <rect width="100%" height="100%" fill="${showRadial ? `url(#${idPrefix}radial-bg)` : palette.background}" />

  <!-- Ambient Backdrop Halo -->
  <circle cx="${cx}" cy="${emblemCenterY}" r="${Math.min(width, height) * 0.36}" fill="url(#${idPrefix}radial-halo)" ${showGlow ? `filter="url(#${idPrefix}ambient-glow)"` : ''} opacity="0.65" />

  <!-- Tech Ring Aesthetic Accents -->
  <circle cx="${cx}" cy="${emblemCenterY}" r="${Math.min(width, height) * 0.28}" fill="none" stroke="${palette.primary}" stroke-width="2" stroke-opacity="0.45" stroke-dasharray="8 10" />
  <circle cx="${cx}" cy="${emblemCenterY}" r="${Math.min(width, height) * 0.32}" fill="none" stroke="${palette.accent}" stroke-width="1.5" stroke-opacity="0.3" />

  <!-- Central Emblem with Drop-Shadow & Scaling -->
  <g transform="translate(${cx}, ${emblemCenterY}) scale(${scale})" ${showShadow ? `filter="url(#${idPrefix}drop-shadow)"` : ''}>
    ${emblemSvg}
  </g>

  <!-- Typography -->
  ${titleSvg}
  ${subtitleSvg}

  <!-- Optional Injected Children -->
  ${opts.customChildren || ''}
</svg>`;

  if (opts.sanitize !== false) {
    return sanitizeSvg(markup);
  }

  return markup;
}

/**
 * Generates an SVG vector asset and encodes it as a Data URI.
 */
export function generateSvgDataUri(
  options?: VectorGenerationOptions,
  encoding: 'base64' | 'utf8' = 'base64'
): string {
  const svg = generateSvg(options);
  return svgToDataUri(svg, encoding);
}

/**
 * VectorEngine Facade Class
 */
export class VectorEngine {
  static generate(options?: VectorGenerationOptions): string {
    return generateSvg(options);
  }

  static generateDataUri(options?: VectorGenerationOptions, encoding?: 'base64' | 'utf8'): string {
    return generateSvgDataUri(options, encoding);
  }

  static sanitize(svgMarkup: string): string {
    return sanitizeSvg(svgMarkup);
  }

  static isSafe(svgMarkup: string): boolean {
    return isSvgSafe(svgMarkup);
  }

  static computePalette(baseHex: string, options?: { mode?: 'dark' | 'light' }): ColorPalette {
    return computeColorPalette(baseHex, options);
  }

  static getDimensions(aspectRatio: VectorAspectRatio): AspectRatioConfig {
    return getDimensionsForAspectRatio(aspectRatio);
  }

  static toDataUri(svg: string, encoding?: 'base64' | 'utf8'): string {
    return svgToDataUri(svg, encoding);
  }
}
