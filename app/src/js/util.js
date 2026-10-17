export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v)));

export const toHex = (r, g, b) =>
  '#' + [r, g, b].map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();

export const toRgbString = (r, g, b) =>
  `rgb(${clamp(r, 0, 255)}, ${clamp(g, 0, 255)}, ${clamp(b, 0, 255)})`;

export const luminance = (r, g, b) =>
  0.2126 * clamp(r, 0, 255) + 0.7152 * clamp(g, 0, 255) + 0.0722 * clamp(b, 0, 255);

// Perceptual output of an RGB light: the brightest channel drives how much
// light the bulb emits. 0 = off, 1 = at least one channel at max. Mild gamma
// (^0.8) so mid-range colors do not look too dim. `luminance()` is the tool
// for text contrast, not for emission (its green weight would fade red/blue).
export const bulbBrightness = (r, g, b) =>
  Math.pow(Math.max(clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)) / 255, 0.8);

export const TOTAL_COLORS = 256 ** 3; // 16_777_216

// reveal.js `hash: true` calls history.replaceState(location.pathname) on the
// first write. Chromium forbids that on the opaque `file://` origin and throws
// a SecurityError, so hash URLs must be disabled when the deck is opened from
// disk. Keep them for dev/hosted builds.
export const shouldUseHash = (protocol) => protocol !== 'file:';

// Relative drag mapping for the light cups: moving the pointer up by
// `trackHeight` pixels adds 255 to the value. Returns an integer in 0..255.
export const dragValue = (startValue, startY, currentY, trackHeight) =>
  clamp(startValue + ((startY - currentY) / trackHeight) * 255, 0, 255);
