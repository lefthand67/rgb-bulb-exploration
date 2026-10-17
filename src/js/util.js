export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v)));

export const toHex = (r, g, b) =>
  '#' + [r, g, b].map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();

export const toRgbString = (r, g, b) =>
  `rgb(${clamp(r, 0, 255)}, ${clamp(g, 0, 255)}, ${clamp(b, 0, 255)})`;

export const luminance = (r, g, b) =>
  0.2126 * clamp(r, 0, 255) + 0.7152 * clamp(g, 0, 255) + 0.0722 * clamp(b, 0, 255);

export const TOTAL_COLORS = 256 ** 3; // 16_777_216
