/** HSL / RGB / HEX 转换与配色方案计算 */
(function (global) {
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        default: h = ((r - g) / d + 4) / 6;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) {
      const v = l * 255;
      return { r: v, g: v, b: v };
    }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
      r: hue2rgb(p, q, h + 1 / 3) * 255,
      g: hue2rgb(p, q, h) * 255,
      b: hue2rgb(p, q, h - 1 / 3) * 255,
    };
  }

  function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b);
  }

  function hslToHex(h, s, l) {
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
  }

  function relativeLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function contrastRatio(hex1, hex2) {
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);
    const l1 = relativeLuminance(c1.r, c1.g, c1.b);
    const l2 = relativeLuminance(c2.r, c2.g, c2.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  const SCHEME_INFO = {
    complementary: {
      name: '互补色',
      desc: '色轮上相对 180° 的两色，对比强烈，适合强调与视觉焦点。',
      offsets: [0, 180],
    },
    analogous: {
      name: '相似色',
      desc: '色轮上相邻 30° 内的颜色，和谐统一，适合自然、柔和的氛围。（别名：类似色）',
      offsets: [0, -30, 30],
    },
    triadic: {
      name: '对比色',
      desc: '色轮上等距 120° 的三色，平衡且活泼，适合需要多样性的设计。（别名：三角配色）',
      offsets: [0, 120, 240],
    },
    'split-complementary': {
      name: '分裂补色',
      desc: '主色 + 互补色两侧各 30°，比互补色更柔和，仍保持对比。（别名：分裂互补）',
      offsets: [0, 150, 210],
    },
    tetradic: {
      name: '四方色',
      desc: '色轮上两组互补色（矩形），色彩丰富，需控制主次避免杂乱。（别名：四角配色）',
      offsets: [0, 90, 180, 270],
    },
    monochromatic: {
      name: '同类色',
      desc: '同一色相不同明度/饱和度，简洁优雅，层次感来自明暗变化。（别名：单色）',
      offsets: [0],
      lightness: [25, 50, 75],
    },
  };

  function generateScheme(hex, schemeKey) {
    const { h, s, l } = hexToHsl(hex);
    const info = SCHEME_INFO[schemeKey];

    if (schemeKey === 'monochromatic') {
      return info.lightness.map(lt => hslToHex(h, s, lt));
    }

    return info.offsets.map(offset => {
      const nh = (h + offset + 360) % 360;
      return hslToHex(nh, s, l);
    });
  }

  function randomHex() {
    const h = Math.random() * 360;
    const s = 50 + Math.random() * 40;
    const l = 40 + Math.random() * 30;
    return hslToHex(h, s, l);
  }

  function randomSchemeType() {
    const keys = Object.keys(SCHEME_INFO);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  global.ColorPractice = global.ColorPractice || {};
  global.ColorPractice.utils = {
    hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hexToHsl, hslToHex,
    relativeLuminance, contrastRatio, SCHEME_INFO, generateScheme,
    randomHex, randomSchemeType, shuffle,
  };
})(window);
