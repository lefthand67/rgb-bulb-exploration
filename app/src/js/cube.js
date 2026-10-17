import { clamp } from './util.js';

/**
 * Representative blue values for the cube sheets: always 0 (back, blue off)
 * and 255 (front, blue full) plus evenly spaced values in between.
 */
export function sliceBlues(count = 5) {
  const step = 255 / (count - 1);
  return Array.from({ length: count }, (_, i) => clamp(Math.round(i * step), 0, 255));
}

/**
 * Isometric projection for the unit cube `0..1` on each axis (light lab):
 * red → right and slightly down, green → down, blue (sheets) → up-right.
 */
export function isoProjection(x = 0, y = 0, z = 0) {
  return {
    x: x + 0.6 * z,
    y: 0.35 * x + y - 0.7 * z,
  };
}

// A sheet of the cube: the previous slide's R×G field (256 × 256), tinted by
// one blue value. Rendered offscreen once per distinct blue level.
function sheetBitmap(blue) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      img.data[i] = x;
      img.data[i + 1] = y;
      img.data[i + 2] = blue;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Isometric cube of light. The blue axis stacks 256 sheets; illustrative
 * sheets are drawn at a few blue levels so they visibly differ. The sheet
 * matching the slider is highlighted with the caption «один лист = 65 536
 * цветов». Pure canvas, no dependencies; re-renders only on slider change.
 */
export function createCubeIllustration({ mountEl } = {}) {
  mountEl.innerHTML = `
    <div class="cube-iso">
      <canvas class="cube-iso__canvas" width="420" height="210"
              role="img" aria-label="Куб из 256 листов по 65 536 цветов: на каждом листе красный и зелёный, синева выбирает лист"></canvas>
      <div class="cube-iso__caption" data-cube-caption></div>
      <div class="cube-iso__slider-row">
        <label for="cubeBlue">Синий свет</label>
        <input id="cubeBlue" type="range" min="0" max="255" step="1" value="255" aria-label="Синий свет">
        <span data-cube-blue-value>255</span>
      </div>
    </div>
  `;

  const canvas = mountEl.querySelector('canvas');
  const slider = mountEl.querySelector('input[type="range"]');
  const valueEl = mountEl.querySelector('[data-cube-blue-value]');
  const caption = mountEl.querySelector('[data-cube-caption]');

  const cache = new Map();
  const bitmapFor = (blue) => {
    if (!cache.has(blue)) cache.set(blue, sheetBitmap(blue));
    return cache.get(blue);
  };

  const draw = () => {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const blue = clamp(parseInt(slider.value, 10), 0, 255);
    valueEl.textContent = String(blue);

    const sheetW = 150, sheetH = 95, tilt = 16;
    const depthX = 46, depthY = -38; // blue axis: right and up

    // corners of the sheet at blue fraction z (A bottom-left, B bottom-right,
    // C top-right, D top-left)
    const quad = (z) => {
      const ax = 34 + z * depthX, ay = H - 24 + z * depthY;
      return {
        A: [ax, ay],
        B: [ax + sheetW, ay - tilt],
        C: [ax + sheetW, ay - tilt - sheetH],
        D: [ax, ay - sheetH],
      };
    };

    const trace = (q) => {
      ctx.beginPath();
      ctx.moveTo(q.A[0], q.A[1]);
      ctx.lineTo(q.B[0], q.B[1]);
      ctx.lineTo(q.C[0], q.C[1]);
      ctx.lineTo(q.D[0], q.D[1]);
      ctx.closePath();
    };
    const paintSheet = (q, blue, alpha) => {
      const m = bitmapFor(blue);
      ctx.save();
      ctx.globalAlpha = alpha;
      trace(q);
      ctx.clip();
      ctx.translate(q.A[0], q.A[1]);
      ctx.transform(
        (q.B[0] - q.A[0]) / 256, (q.B[1] - q.A[1]) / 256, // x basis (red)
        (q.D[0] - q.A[0]) / 256, (q.D[1] - q.A[1]) / 256, // y basis (green)
        0, 0
      );
      ctx.drawImage(m, -1, -1, 258, 258);
      ctx.restore();
      trace(q);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // back-to-front
    const sheets = sliceBlues(5);
    sheets.forEach((b) => {
      if (b === blue) return;
      paintSheet(quad(b / 255), b, b === 0 ? 0.9 : 0.35);
    });

    // highlighted sheet on top
    const hq = quad(blue / 255);
    paintSheet(hq, blue, 1);
    trace(hq);
    ctx.strokeStyle = '#ffe8a3';
    ctx.lineWidth = 3;
    ctx.stroke();

    // axes labels, drawn into the canvas so they never collide with the slider
    const ax0 = 34;
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(160, 174, 192, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('Красный →', 60, H - 8);
    ctx.save();
    ctx.translate(18, H - 70);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Зелёный ↑', 0, 0);
    ctx.restore();
    ctx.fillStyle = '#3b7bff';
    ctx.fillText('Синий ↗', ax0 + sheetW + depthX + 6, H - 24 + depthY - tilt - sheetH - 6);
    if (caption) caption.textContent = `Синий ${blue}: такой лист = 65 536 цветов`;
  };

  slider.addEventListener('input', draw);
  draw();

  return {
    setBlue(v) { slider.value = clamp(v, 0, 255); draw(); },
    destroy() { slider.removeEventListener('input', draw); },
  };
}