import confetti from 'canvas-confetti';
import { toHex, toRgbString, clamp } from './util.js';

const TARGETS = [
  { name: '☀️ Солнце', r: 255, g: 220, b: 0 },
  { name: '🌊 Океан', r: 0, g: 120, b: 255 },
  { name: '🌱 Трава', r: 40, g: 200, b: 60 },
  { name: '🍬 Жвачка', r: 255, g: 105, b: 180 },
  { name: '🌙 Полночь', r: 10, g: 20, b: 50 }
];

export function createChallenge({ mountEl, store }) {
  let currentIndex = 0;
  let solvedCount = 0;

  mountEl.innerHTML = `
    <div class="challenge-box">
      <div class="challenge-header">
        <h3 class="challenge-title">Цель: повтори цвет «${TARGETS[0].name}»</h3>
      </div>
      <div class="target-preview">
        <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
          <span style="font-size:0.9em; font-weight:700;">Образец</span>
          <div class="swatch-target"></div>
        </div>
        <div style="font-size:2em;">➔</div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
          <span style="font-size:0.9em; font-weight:700;">Твой свет</span>
          <div class="swatch-current"></div>
        </div>
      </div>
      <div class="challenge-status" style="font-weight:700; color: var(--accent); min-height: 1.5em;"></div>
      <div class="challenge-controls">
        <button class="btn-primary btn-check">Проверить цвет!</button>
        <button class="preset-chip btn-skip">Пропустить ➔</button>
      </div>
      <div class="cup-value-pill">Решено цветов: <span class="solved-badge">0</span> из 16 777 216</div>
    </div>
  `;

  const titleEl = mountEl.querySelector('.challenge-title');
  const swatchTarget = mountEl.querySelector('.swatch-target');
  const swatchCurrent = mountEl.querySelector('.swatch-current');
  const statusEl = mountEl.querySelector('.challenge-status');
  const btnCheck = mountEl.querySelector('.btn-check');
  const btnSkip = mountEl.querySelector('.btn-skip');
  const solvedBadge = mountEl.querySelector('.solved-badge');

  function loadTarget(index) {
    currentIndex = index % TARGETS.length;
    const t = TARGETS[currentIndex];
    titleEl.textContent = `Цель: повтори цвет «${t.name}»`;
    swatchTarget.style.backgroundColor = toRgbString(t.r, t.g, t.b);
    statusEl.textContent = '';
  }

  loadTarget(0);

  // Update current swatch on store change
  const unsubscribe = store.subscribe(({ r, g, b }) => {
    swatchCurrent.style.backgroundColor = toRgbString(r, g, b);
  });

  btnCheck.addEventListener('click', () => {
    const current = store.get();
    const target = TARGETS[currentIndex];
    const tolerance = 24;

    const diffR = Math.abs(current.r - target.r);
    const diffG = Math.abs(current.g - target.g);
    const diffB = Math.abs(current.b - target.b);

    if (diffR <= tolerance && diffG <= tolerance && diffB <= tolerance) {
      solvedCount++;
      solvedBadge.textContent = solvedCount;
      statusEl.textContent = '🎉 Ура! Точно в цель!';
      
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setTimeout(() => {
        loadTarget(currentIndex + 1);
      }, 2000);
    } else {
      // Give hint
      let hints = [];
      if (current.r < target.r - tolerance) hints.push('Добавь красного');
      else if (current.r > target.r + tolerance) hints.push('Убавь красный');

      if (current.g < target.g - tolerance) hints.push('Добавь зелёного');
      else if (current.g > target.g + tolerance) hints.push('Убавь зелёный');

      if (current.b < target.b - tolerance) hints.push('Добавь синего');
      else if (current.b > target.b + tolerance) hints.push('Убавь синий');

      statusEl.textContent = hints.length ? `🔍 Близко! Подсказка: ${hints[0]}` : '🔍 Почти! Покрути ещё чуть-чуть.';
    }
  });

  btnSkip.addEventListener('click', () => {
    loadTarget(currentIndex + 1);
  });

  return {
    destroy() {
      unsubscribe();
    }
  };
}
