import { clamp } from './util.js';

/**
 * Map a pointer position to the (r, g) grid cell it hits. `rect` is the
 * element's bounding box; the canvas natural size is 256 × 256. Returns null
 * when the pointer is outside the canvas.
 */
export function cellFromPointer(rect, clientX, clientY) {
  if (
    clientX < rect.left || clientX > rect.left + rect.width ||
    clientY < rect.top || clientY > rect.top + rect.height
  ) return null;
  const scaleX = 256 / rect.width;
  const scaleY = 256 / rect.height;
  const r = clamp(Math.floor((clientX - rect.left) * scaleX), 0, 255);
  const g = clamp(Math.floor((clientY - rect.top) * scaleY), 0, 255);
  return { r, g };
}

export function createStrip1D({ mountEl }) {
  mountEl.innerHTML = `
    <div class="strip-container">
      <canvas class="pixel-strip" width="256" height="1"
              role="img" aria-label="Полоска из 256 оттенков красного: слева 0 (темнота), справа 255 (самый яркий красный)"></canvas>
      <div class="strip-ends">
        <span>0</span><span>255</span>
      </div>
      <div class="cup-value-pill">256 шагов (0 тоже шаг!)</div>
    </div>
  `;

  const canvas = mountEl.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(256, 1);

  for (let x = 0; x < 256; x++) {
    const i = x * 4;
    imgData.data[i] = x;     // R
    imgData.data[i + 1] = 0; // G
    imgData.data[i + 2] = 0; // B
    imgData.data[i + 3] = 255; // A
  }
  ctx.putImageData(imgData, 0, 0);
}

export function createGrid2D({ mountEl, onSelect }) {
  mountEl.innerHTML = `
    <div class="grid2d-wrapper">
      <div class="grid2d-legend">
        <div class="legend-chip" data-chip-corner="0,0">чёрный (0, 0)</div>
        <div class="legend-chip" data-chip-corner="255,0"><span class="legend-swatch" style="background: rgb(255,0,0)"></span> красный (255, 0)</div>
        <div class="legend-chip" data-chip-corner="0,255"><span class="legend-swatch" style="background: rgb(0,255,0)"></span> зелёный (0, 255)</div>
        <div class="legend-chip" data-chip-corner="255,255"><span class="legend-swatch" style="background: rgb(255,255,0)"></span> жёлтый (255, 255)</div>
      </div>
      <div class="grid2d-axes">
        <div class="grid2d-axis-y" aria-hidden="true"><span>255</span><span>Зелёный ↑</span><span>0</span></div>
        <div class="grid2d-canvas-wrap">
          <canvas class="pixel-grid" width="256" height="256"
                  role="img" aria-label="Поле 256 на 256: красный свет по горизонтали, зелёный по вертикали"></canvas>
          <div class="grid2d-highlight grid2d-highlight--row" aria-hidden="true"></div>
          <div class="grid2d-highlight grid2d-highlight--col" aria-hidden="true"></div>
        </div>
        <div class="grid2d-preview" data-grid-preview>
          <div class="grid2d-swatch" data-grid-swatch></div>
          <div class="grid2d-numbers" data-grid-numbers>наведите на клетку</div>
        </div>
      </div>
      <div class="grid2d-axis-x" aria-hidden="true"><span>0</span><span>Красный →</span><span>255</span></div>
      <div class="cup-value-pill">256 × 256 = 65 536 цветов</div>
    </div>
  `;

  const canvas = mountEl.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(256, 256);

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      imgData.data[i] = x;     // R on X axis
      imgData.data[i + 1] = y; // G on Y axis
      imgData.data[i + 2] = 0; // B fixed at 0
      imgData.data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const wrap = mountEl.querySelector('.grid2d-canvas-wrap');
  const rowHl = mountEl.querySelector('.grid2d-highlight--row');
  const colHl = mountEl.querySelector('.grid2d-highlight--col');
  const swatchEl = mountEl.querySelector('[data-grid-swatch]');
  const numbersEl = mountEl.querySelector('[data-grid-numbers]');

  const showCell = (r, g) => {
    if (rowHl) rowHl.style.top = `calc(${g} / 256 * 100%)`;
    if (colHl) colHl.style.left = `calc(${r} / 256 * 100%)`;
    if (wrap) wrap.classList.add('has-highlight');
    if (swatchEl) swatchEl.style.background = `rgb(${r}, ${g}, 0)`;
    if (numbersEl) {
      numbersEl.textContent = `красный ${r} · зелёный ${g}`;
    }
    if (onSelect) onSelect(r, g, 0);
  };

  const hideCell = () => {
    if (wrap) wrap.classList.remove('has-highlight');
    if (numbersEl && numbersEl.dataset.initial === undefined) {
      numbersEl.textContent = 'наведите на клетку';
    }
  };

  // one handler for hover and click; touch taps synthesise a click
  const handle = (e) => {
    const cell = cellFromPointer(canvas.getBoundingClientRect(), e.clientX, e.clientY);
    if (cell) showCell(cell.r, cell.g);
    else hideCell();
  };
  canvas.addEventListener('mousemove', handle);
  canvas.addEventListener('click', handle);
  canvas.addEventListener('mouseleave', hideCell);
}