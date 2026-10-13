import { describe, it, expect } from 'vitest';
import {
  generateSvg,
  generateSvgDataUri,
  sanitizeSvg,
  isSvgSafe,
  svgToDataUri,
  computeColorPalette,
  computeComplementaryColor,
  computeTriadicColors,
  parseHexColor,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hslToHex,
  getDimensionsForAspectRatio,
  renderEmblemPath,
  VectorEngine,
  ASPECT_RATIO_CONFIGS,
  type VectorAspectRatio,
  type EmblemType,
} from './vector-engine.ts';

/**
 * Validates XML tag balancing and well-formedness.
 * Throws an error or returns false if tags are improperly nested or unclosed.
 */
function validateXmlTagBalancing(xml: string): { isValid: boolean; unclosedTags: string[] } {
  const stack: string[] = [];
  // Regex to extract XML comments and tags
  // Strip comments first
  const stripped = xml.replace(/<!--[\s\S]*?-->/g, '');

  const tagRegex = /<(\/)?([a-zA-Z0-9:-]+)([^>]*?)(\/)?>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(stripped)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    const isSelfClosing = match[4] === '/' || match[3].trim().endsWith('/');

    if (isSelfClosing) {
      // Self closing <path ... />, <circle ... />, <rect ... />, etc.
      continue;
    } else if (isClosing) {
      if (stack.length === 0) {
        return { isValid: false, unclosedTags: [`Unexpected closing tag: </${tagName}>`] };
      }
      const last = stack.pop();
      if (last !== tagName) {
        return {
          isValid: false,
          unclosedTags: [`Mismatched closing tag: expected </${last}>, got </${tagName}>`],
        };
      }
    } else {
      // Opening tag
      stack.push(tagName);
    }
  }

  return {
    isValid: stack.length === 0,
    unclosedTags: stack,
  };
}

describe('UMAR OS Vector Intelligence Engine (vector-engine.ts)', () => {
  describe('1. Aspect Ratios & Dimensions Verification', () => {
    it('verifies 1:1 square canvas dimensions and viewBox', () => {
      const dim = getDimensionsForAspectRatio('1:1');
      expect(dim.aspectRatio).toBe('1:1');
      expect(dim.width).toBe(1080);
      expect(dim.height).toBe(1080);
      expect(dim.viewBox).toBe('0 0 1080 1080');

      const svg = generateSvg({ aspectRatio: '1:1' });
      expect(svg).toContain('viewBox="0 0 1080 1080"');
      expect(svg).toContain('width="1080"');
      expect(svg).toContain('height="1080"');
    });

    it('verifies 16:9 widescreen canvas dimensions and viewBox', () => {
      const dim = getDimensionsForAspectRatio('16:9');
      expect(dim.aspectRatio).toBe('16:9');
      expect(dim.width).toBe(1920);
      expect(dim.height).toBe(1080);
      expect(dim.viewBox).toBe('0 0 1920 1080');

      const svg = generateSvg({ aspectRatio: '16:9' });
      expect(svg).toContain('viewBox="0 0 1920 1080"');
      expect(svg).toContain('width="1920"');
      expect(svg).toContain('height="1080"');
    });

    it('verifies 9:16 vertical canvas dimensions and viewBox', () => {
      const dim = getDimensionsForAspectRatio('9:16');
      expect(dim.aspectRatio).toBe('9:16');
      expect(dim.width).toBe(1080);
      expect(dim.height).toBe(1920);
      expect(dim.viewBox).toBe('0 0 1080 1920');

      const svg = generateSvg({ aspectRatio: '9:16' });
      expect(svg).toContain('viewBox="0 0 1080 1920"');
      expect(svg).toContain('width="1080"');
      expect(svg).toContain('height="1920"');
    });

    it('verifies error thrown for unsupported aspect ratios', () => {
      expect(() => getDimensionsForAspectRatio('4:3' as any)).toThrowError(
        'Unsupported aspect ratio: "4:3"'
      );
    });
  });

  describe('2. Color Palette Calculations (Harmonics, Complementary & Triadic)', () => {
    it('correctly parses hex and normalizes RGB & HSL conversions', () => {
      const rgb = parseHexColor('#FF0000');
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
      expect(rgbToHex(rgb)).toBe('#FF0000');

      const hsl = rgbToHsl(rgb);
      expect(hsl).toEqual({ h: 0, s: 100, l: 50 });

      const reconstructedHex = hslToHex(hsl);
      expect(reconstructedHex).toBe('#FF0000');
    });

    it('handles 3-digit shorthand hex codes', () => {
      const rgb = parseHexColor('#F50');
      expect(rgb).toEqual({ r: 255, g: 85, b: 0 });
      expect(rgbToHex(rgb)).toBe('#FF5500');
    });

    it('throws error for invalid hex codes', () => {
      expect(() => parseHexColor('invalid')).toThrowError('Invalid hex color');
      expect(() => parseHexColor('#12345')).toThrowError('Invalid hex color');
      expect(() => parseHexColor('#ZZZZZZ')).toThrowError('Invalid hex color');
    });

    it('computes exact 180-degree complementary colors', () => {
      // Pure Red (#FF0000, 0 deg) -> Cyan (#00FFFF, 180 deg)
      const compRed = computeComplementaryColor('#FF0000');
      expect(compRed).toBe('#00FFFF');

      // Pure Blue (#0000FF, 240 deg) -> Yellow (#FFFF00, 60 deg)
      const compBlue = computeComplementaryColor('#0000FF');
      expect(compBlue).toBe('#FFFF00');

      // Pure Green (#00FF00, 120 deg) -> Magenta (#FF00FF, 300 deg)
      const compGreen = computeComplementaryColor('#00FF00');
      expect(compGreen).toBe('#FF00FF');
    });

    it('computes exact triadic palettes (+120 deg and +240 deg shifts)', () => {
      // Pure Red (#FF0000, 0 deg) -> Green (120 deg) & Blue (240 deg)
      const triadicRed = computeTriadicColors('#FF0000');
      expect(triadicRed).toEqual(['#FF0000', '#00FF00', '#0000FF']);

      // Pure Green (#00FF00, 120 deg) -> Blue (240 deg) & Red (0 deg)
      const triadicGreen = computeTriadicColors('#00FF00');
      expect(triadicGreen).toEqual(['#00FF00', '#0000FF', '#FF0000']);

      // Pure Blue (#0000FF, 240 deg) -> Red (0 deg) & Green (120 deg)
      const triadicBlue = computeTriadicColors('#0000FF');
      expect(triadicBlue).toEqual(['#0000FF', '#FF0000', '#00FF00']);
    });

    it('computes rich full harmonious color palette (primary, accent, background, surface, glow)', () => {
      const palette = computeColorPalette('#6366F1'); // Indigo 500
      expect(palette.primary).toBe('#6366F1');
      expect(palette.complementary).toBeDefined();
      expect(palette.triadic.length).toBe(3);
      expect(palette.triadic[0]).toBe('#6366F1');
      expect(palette.accent).toBe(palette.triadic[1]);
      expect(palette.background).toMatch(/^#[0-9A-F]{6}$/);
      expect(palette.surface).toMatch(/^#[0-9A-F]{6}$/);
      expect(palette.glow).toMatch(/^#[0-9A-F]{6}$/);
      expect(palette.analogous.length).toBe(3);
    });

    it('supports light mode palette calculations', () => {
      const darkPalette = computeColorPalette('#4F46E5', { mode: 'dark' });
      const lightPalette = computeColorPalette('#4F46E5', { mode: 'light' });

      // Light background should be significantly lighter than dark background
      const darkRgb = parseHexColor(darkPalette.background);
      const lightRgb = parseHexColor(lightPalette.background);
      expect(lightRgb.r + lightRgb.g + lightRgb.b).toBeGreaterThan(
        darkRgb.r + darkRgb.g + darkRgb.b
      );
    });
  });

  describe('3. Clean SVG Markup Generation & XML Tag Balancing', () => {
    it('generates pristine XML with perfectly balanced opening and closing tags', () => {
      const svg = generateSvg({
        aspectRatio: '1:1',
        title: 'OrderKing AI',
        subtitle: 'Autonomous Commerce',
        emblem: 'crown',
      });

      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);

      const xmlValidation = validateXmlTagBalancing(svg);
      expect(xmlValidation.isValid).toBe(true);
      expect(xmlValidation.unclosedTags).toEqual([]);
    });

    it('validates XML tag balancing across all aspect ratios', () => {
      const ratios: VectorAspectRatio[] = ['1:1', '16:9', '9:16'];
      for (const ratio of ratios) {
        const svg = generateSvg({ aspectRatio: ratio, title: `Test ${ratio}` });
        const result = validateXmlTagBalancing(svg);
        expect(result.isValid).toBe(true);
        expect(result.unclosedTags).toEqual([]);
      }
    });

    it('embeds ambient glow, drop-shadow filters, and radial gradients in defs', () => {
      const idPrefix = 'custom-test';
      const svg = generateSvg({
        idPrefix,
        showAmbientGlow: true,
        showDropShadow: true,
        showRadialGradients: true,
      });

      expect(svg).toContain(`<filter id="${idPrefix}-ambient-glow"`);
      expect(svg).toContain(`<filter id="${idPrefix}-drop-shadow"`);
      expect(svg).toContain(`<radialGradient id="${idPrefix}-radial-bg"`);
      expect(svg).toContain(`<radialGradient id="${idPrefix}-radial-halo"`);
      expect(svg).toContain(`<linearGradient id="${idPrefix}-emblem-grad"`);

      // Verify feGaussianBlur and feMerge nodes
      expect(svg).toContain('<feGaussianBlur');
      expect(svg).toContain('<feMerge>');
      expect(svg).toContain('<feMergeNode');
    });

    it('allows toggling off glow, shadows, or gradients', () => {
      const svg = generateSvg({
        showAmbientGlow: false,
        showDropShadow: false,
        showRadialGradients: false,
      });

      expect(svg).not.toContain('id="ok-vec-ambient-glow"');
      expect(svg).not.toContain('id="ok-vec-drop-shadow"');
      expect(svg).not.toContain('id="ok-vec-radial-bg"');
    });
  });

  describe('4. Emblem Variants Rendering (Crown, Shield, Zap, Utensils)', () => {
    const emblems: EmblemType[] = ['crown', 'shield', 'zap', 'utensils'];

    it.each(emblems)('renders %s emblem with balanced tags and distinct geometry', (emblem) => {
      const svg = generateSvg({ emblem, idPrefix: `emb-${emblem}` });
      expect(svg).toContain(`id="emb-${emblem}-emblem-${emblem}"`);

      const result = validateXmlTagBalancing(svg);
      expect(result.isValid).toBe(true);
      expect(result.unclosedTags).toEqual([]);
    });

    it('supports case-insensitive emblem names (Crown, Shield, Zap, Utensils)', () => {
      const svgCrown = generateSvg({ emblem: 'Crown' as EmblemType });
      expect(svgCrown).toContain('id="ok-vec-emblem-crown"');

      const svgShield = generateSvg({ emblem: 'Shield' as EmblemType });
      expect(svgShield).toContain('id="ok-vec-emblem-shield"');

      const svgZap = generateSvg({ emblem: 'Zap' as EmblemType });
      expect(svgZap).toContain('id="ok-vec-emblem-zap"');

      const svgUtensils = generateSvg({ emblem: 'Utensils' as EmblemType });
      expect(svgUtensils).toContain('id="ok-vec-emblem-utensils"');
    });

    it('throws an error for unsupported emblems', () => {
      expect(() => renderEmblemPath('dragon' as any, '#FFF', '#000', 'test-')).toThrowError(
        'Unsupported emblem: "dragon"'
      );
    });
  });

  describe('5. High-Performance SVG Sanitizer & Security', () => {
    it('completely strips script tags and nested malicious injection', () => {
      const maliciousSvg = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <script>alert("pwned");</script>
          <script type="text/javascript">document.location="http://evil.com"</script>
          <rect width="100" height="100" fill="red" />
        </svg>
      `;

      const cleaned = sanitizeSvg(maliciousSvg);
      expect(cleaned).not.toContain('<script');
      expect(cleaned).not.toContain('alert(');
      expect(cleaned).toContain('<rect width="100" height="100" fill="red" />');
    });

    it('neutralizes inline event handlers (onload, onclick, onerror)', () => {
      const maliciousSvg = `
        <svg onload="alert(1)" onclick="stealCookies()" onmouseover="hack()">
          <path d="M0,0 L10,10" onerror="alert(2)" />
        </svg>
      `;

      const cleaned = sanitizeSvg(maliciousSvg);
      expect(cleaned).not.toContain('onload');
      expect(cleaned).not.toContain('onclick');
      expect(cleaned).not.toContain('onmouseover');
      expect(cleaned).not.toContain('onerror');
      expect(cleaned).toContain('<svg');
      expect(cleaned).toContain('<path d="M0,0 L10,10" />');
    });

    it('strips dangerous javascript: URL schemes in attributes', () => {
      const maliciousSvg = `
        <svg>
          <a href="javascript:alert(1)">Click</a>
          <image xlink:href="javascript:void(0)" />
          <use href="#legit-id" />
        </svg>
      `;

      const cleaned = sanitizeSvg(maliciousSvg);
      expect(cleaned).not.toContain('javascript:');
      expect(cleaned).toContain('href="#legit-id"');
    });

    it('strips dangerous CSS expressions in style attributes', () => {
      const maliciousSvg = `
        <svg>
          <rect style="background: expression(alert(1));" width="100" height="100" />
          <circle style="fill: red; stroke: blue;" r="10" />
        </svg>
      `;

      const cleaned = sanitizeSvg(maliciousSvg);
      expect(cleaned).not.toContain('expression(');
      expect(cleaned).toContain('style="fill: red; stroke: blue;"');
    });

    it('strips DOCTYPE and ENTITY declarations to prevent XXE', () => {
      const xxeSvg = `
        <!DOCTYPE svg [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
        <svg>&xxe;</svg>
      `;

      const cleaned = sanitizeSvg(xxeSvg);
      expect(cleaned).not.toContain('<!DOCTYPE');
      expect(cleaned).not.toContain('<!ENTITY');
    });

    it('isSvgSafe correctly identifies safe and unsafe SVGs', () => {
      const safe = generateSvg({ emblem: 'crown' });
      expect(isSvgSafe(safe)).toBe(true);

      expect(isSvgSafe('<svg><script>alert(1)</script></svg>')).toBe(false);
      expect(isSvgSafe('<svg onload="evil()"></svg>')).toBe(false);
      expect(isSvgSafe('<svg><a href="javascript:void(0)">x</a></svg>')).toBe(false);
      expect(isSvgSafe('<!DOCTYPE svg><svg></svg>')).toBe(false);
    });
  });

  describe('6. Data URI & Image Conversion', () => {
    it('generates base64 data URI format suitable for img src', () => {
      const dataUri = generateSvgDataUri({
        aspectRatio: '1:1',
        title: 'King Soundbox',
      });

      expect(dataUri.startsWith('data:image/svg+xml;base64,')).toBe(true);
      const base64Part = dataUri.replace('data:image/svg+xml;base64,', '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      expect(decoded).toContain('<svg');
      expect(decoded).toContain('King Soundbox');
      expect(decoded).toContain('</svg>');
    });

    it('generates utf-8 charset data URI format', () => {
      const dataUri = generateSvgDataUri(
        {
          aspectRatio: '16:9',
          title: 'Widescreen Display',
        },
        'utf8'
      );

      expect(dataUri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
      const uriEncoded = dataUri.replace('data:image/svg+xml;charset=utf-8,', '');
      const decoded = decodeURIComponent(uriEncoded);
      expect(decoded).toContain('Widescreen Display');
    });

    it('converts raw SVG string to data URI using svgToDataUri', () => {
      const raw = '<svg><circle cx="50" cy="50" r="50"/></svg>';
      const b64 = svgToDataUri(raw, 'base64');
      const utf8 = svgToDataUri(raw, 'utf8');

      expect(b64).toContain('data:image/svg+xml;base64,');
      expect(utf8).toContain('data:image/svg+xml;charset=utf-8,');
    });
  });

  describe('7. VectorEngine Facade API', () => {
    it('executes static helper methods consistently with module functions', () => {
      const svg = VectorEngine.generate({ emblem: 'zap' });
      expect(svg).toContain('id="ok-vec-emblem-zap"');

      const dataUri = VectorEngine.generateDataUri({ emblem: 'utensils' });
      expect(dataUri.startsWith('data:image/svg+xml;base64,')).toBe(true);

      const palette = VectorEngine.computePalette('#10B981');
      expect(palette.primary).toBe('#10B981');

      const dims = VectorEngine.getDimensions('16:9');
      expect(dims.width).toBe(1920);

      const isSafe = VectorEngine.isSafe(svg);
      expect(isSafe).toBe(true);
    });
  });
});
