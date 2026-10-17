import confetti from 'canvas-confetti';
import { toRgbString, TOTAL_COLORS } from './util.js';
import { TARGETS, isColorMatch, hintFor } from './challenge-data.js';

export function createChallenge({ mountEl, store }) {
  let currentIndex = 0;
  const solvedNames = new Set();
  let locked = false;
  let pendingTimer = null;

  mountEl.dataset.targetCount = String(TARGETS.length);
  mountEl.dataset.solvedCount = '0';

  mountEl.innerHTML = `
    <div class="challenge-box">
      <div class="challenge-header">
        <h3 class="challenge-title">Цель: повтори цвет «${TARGETS[0].name}»</h3>
      </div>
      <div class="challenge-row">
        <div class="challenge-cups cups-group"></div>
        <div class="challenge-side">
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
          <div class="challenge-status" aria-live="polite"></div>
          <div class="challenge-controls">
            <button class="btn-primary btn-check">Проверить цвет!</button>
            <button class="preset-chip btn-skip">Пропустить ➔</button>
          </div>
          <div class="cup-value-pill">Найдено: <span class="solved-badge">0</span> из <span class="target-total">${TARGETS.length}</span></div>
          <div class="challenge-total">Всего в RGB: ${TOTAL_COLORS.toLocaleString('ru-RU')}</div>
        </div>
      </div>
    </div>
  `;

  const titleEl = mountEl.querySelector('.challenge-title');
  const swatchTarget = mountEl.querySelector('.swatch-target');
  const swatchCurrent = mountEl.querySelector('.swatch-current');
  const statusEl = mountEl.querySelector('.challenge-status');
  const btnCheck = mountEl.querySelector('.btn-check');
  const btnSkip = mountEl.querySelector('.btn-skip');
  const solvedBadge = mountEl.querySelector('.solved-badge');

  const cancelPending = () => {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
  };

  const renderSolved = () => {
    solvedBadge.textContent = String(solvedNames.size);
    mountEl.dataset.solvedCount = String(solvedNames.size);
  };

  function loadTarget(index) {
    cancelPending();
    locked = false;
    currentIndex = ((index % TARGETS.length) + TARGETS.length) % TARGETS.length;
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
    if (locked) return;
    const current = store.get();
    const target = TARGETS[currentIndex];

    if (isColorMatch(current, target)) {
      // Lock before showing confetti/timer: a double click cannot count twice.
      locked = true;
      solvedNames.add(target.name);
      renderSolved();

      const allFound = solvedNames.size === TARGETS.length;
      statusEl.textContent = allFound
        ? `🎉 Все ${TARGETS.length} цветов найдены!`
        : '🎉 Ура! Точно в цель!';

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      if (!allFound) {
        pendingTimer = setTimeout(() => {
          pendingTimer = null;
          loadTarget(currentIndex + 1);
        }, 2000);
      }
    } else {
      // A wrong guess stays on the same target: the child can keep
      // adjusting the cups or choose «Пропустить». Never auto-advance here.
      statusEl.textContent = `Пока не совпало. ${hintFor(current, target)}`;
    }
  });

  btnSkip.addEventListener('click', () => {
    // A skip during the 2 s auto-next delay advances exactly one target.
    loadTarget(currentIndex + 1);
  });

  return {
    destroy() {
      cancelPending();
      unsubscribe();
    }
  };
}
