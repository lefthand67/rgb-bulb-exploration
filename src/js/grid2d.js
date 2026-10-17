import { clamp } from './util.js';

export function createStrip1D({ mountEl }) {
  mountEl.innerHTML = `
    <div class="strip-container">
      <canvas class="pixel-strip" width="256" height="1"></canvas>
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
    <div class="grid2d-container">
      <canvas class="pixel-grid" width="256" height="256"></canvas>
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

  if (onSelect) {
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      onSelect(clamp(x, 0, 255), clamp(y, 0, 255), 0);
    });
  }
}
