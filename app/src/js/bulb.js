import { toHex, toRgbString, bulbBrightness } from './util.js';

export function createBulb({ mountEl, store }) {
  mountEl.innerHTML = `
    <div class="stage-group">
      <div class="bulb-container">
        <!-- SVG injected inline -->
      </div>
      <div class="readout-box" aria-live="polite">
        <div class="readout-rgb">rgb(0, 0, 0)</div>
        <div class="readout-hex">#000000</div>
      </div>
    </div>
  `;

  const container = mountEl.querySelector('.bulb-container');
  const rgbEl = mountEl.querySelector('.readout-rgb');
  const hexEl = mountEl.querySelector('.readout-hex');

  // The bulb is split into two groups:
  //  - .bulb-body: socket/base/glass outline — always visible, theme-aware
  //  - .bulb-emissive: radial glow + filled glass + filament — only these fade
  //    with brightness, so (255,0,0) and (0,0,255) still look fully bright and
  //    (0,0,0) is genuinely off.
  container.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="100%" height="100%">
      <defs>
        <radialGradient id="bulbGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="var(--bulb-color, #000)" stop-opacity="1" />
          <stop offset="60%" stop-color="var(--bulb-color, #000)" stop-opacity="0.5" />
          <stop offset="100%" stop-color="var(--bulb-color, #000)" stop-opacity="0" />
        </radialGradient>
        <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="15" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g class="bulb-emissive">
        <circle cx="100" cy="100" r="85" fill="url(#bulbGlow)" />
        <path d="M70 160 C50 140 40 115 40 90 A60 60 0 1 1 160 90 C160 115 150 140 130 160 L125 180 C123 185 120 190 115 190 H85 C80 190 77 185 75 180 Z"
              fill="var(--bulb-color, #000)"
              filter="url(#glowFilter)" />
        <path d="M90 120 L95 90 L100 80 L105 90 L110 120" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
        <path d="M85 110 H115" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.7" />
        <path d="M65 70 A45 45 0 0 1 110 45" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.6" />
      </g>

      <g class="bulb-body">
        <path d="M70 160 C50 140 40 115 40 90 A60 60 0 1 1 160 90 C160 115 150 140 130 160 L125 180 C123 185 120 190 115 190 H85 C80 190 77 185 75 180 Z"
              fill="none"
              stroke="var(--bulb-outline, #ffffff)"
              stroke-width="4"
              stroke-opacity="0.8" />
        <rect x="80" y="190" width="40" rx="4" height="12" fill="var(--bulb-body, #718096)" stroke="var(--bulb-outline, #4a5568)" stroke-width="2" />
        <path d="M80 205 H120 V214 H80 Z" fill="var(--bulb-body, #4a5568)" />
        <path d="M83 214 H117 V224 C117 229 113 233 108 233 H92 C87 233 83 229 83 224 Z" fill="var(--bulb-body, #2d3748)" />
        <path d="M95 233 H105 V242 H95 Z" fill="#1a202c" />
      </g>
    </svg>
  `;

  const svgRoot = container.querySelector('svg');
  const emissive = svgRoot.querySelector('.bulb-emissive');

  const unsubscribe = store.subscribe(({ r, g, b }) => {
    const rgbStr = toRgbString(r, g, b);
    const hexStr = toHex(r, g, b);
    const brightness = bulbBrightness(r, g, b);

    svgRoot.style.setProperty('--bulb-color', rgbStr);
    rgbEl.textContent = rgbStr;
    hexEl.textContent = hexStr;

    // Only the emissive parts fade. 0 = off; any channel at 255 = full light.
    emissive.style.opacity = brightness;
  });

  return {
    destroy() {
      unsubscribe();
    }
  };
}