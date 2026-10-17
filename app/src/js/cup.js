import { clamp, dragValue } from './util.js';

export function createCup({ channel, mountEl, store }) {
  const channelNames = { r: 'Красный', g: 'Зелёный', b: 'Синий' };
  const name = channelNames[channel] || channel;

  mountEl.innerHTML = `
    <div class="cup-wrapper" data-channel="${channel}">
      <div class="cup-label">
        <span>${name}</span>
      </div>
      <div class="cup-container" role="slider" aria-label="${name} свет" aria-valuemin="0" aria-valuemax="255" aria-valuenow="0" tabindex="0">
        <div class="cup-ticks"></div>
        <div class="cup-liquid" style="height: 0%;">
          <div class="cup-handle" style="bottom: 0%;"></div>
        </div>
        <input type="range" min="0" max="255" value="0" class="sr-only-input" aria-label="${name} свет" />
      </div>
      <div class="cup-value-pill"><span class="cup-val-num">0</span> / 255</div>
      <div class="cup-controls">
        <button class="cup-btn cup-minus" aria-label="Уменьшить ${name}">-</button>
        <button class="cup-btn cup-plus" aria-label="Увеличить ${name}">+</button>
      </div>
    </div>
  `;

  const wrapper = mountEl.querySelector('.cup-wrapper');
  const cupContainer = mountEl.querySelector('.cup-container');
  const liquid = mountEl.querySelector('.cup-liquid');
  const handle = mountEl.querySelector('.cup-handle');
  const valNum = mountEl.querySelector('.cup-val-num');
  const srInput = mountEl.querySelector('.sr-only-input');
  const btnMinus = mountEl.querySelector('.cup-minus');
  const btnPlus = mountEl.querySelector('.cup-plus');

  let currentValue = 0;

  function updateView(val) {
    currentValue = clamp(val, 0, 255);
    const pct = (currentValue / 255) * 100;
    liquid.style.height = `${pct}%`;
    handle.style.bottom = `0%`; // positioned at top of liquid via absolute bottom
    valNum.textContent = currentValue;
    cupContainer.setAttribute('aria-valuenow', currentValue);
    srInput.value = currentValue;
  }

  // Subscribe to store changes
  const unsubscribe = store.subscribe(state => {
    updateView(state[channel]);
  });

  // Pointer drag handling.
  // We use relative dragging (value changes by the distance the pointer moved)
  // so the level tracks the pointer smoothly instead of jumping to the spot
  // where the click landed. A short press without movement acts as a tap and
  // sets the value to the clicked position.
  let activePointerId = null;
  let startY = 0;
  let startValue = 0;
  let movedDistance = 0;

  function valueFromClientY(clientY) {
    const rect = cupContainer.getBoundingClientRect();
    const ratio = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    return Math.round(ratio * 255);
  }

  function handlePointerDown(e) {
    if (activePointerId !== null) return;
    // Stop Reveal.js from hijacking the gesture for slide navigation.
    e.preventDefault();
    e.stopPropagation();
    activePointerId = e.pointerId;
    startY = e.clientY;
    startValue = store.get()[channel];
    movedDistance = 0;
    cupContainer.focus({ preventScroll: true });
    try {
      cupContainer.setPointerCapture(e.pointerId);
    } catch (_) {}
  }

  function handlePointerMove(e) {
    if (e.pointerId !== activePointerId) return;
    e.preventDefault();
    e.stopPropagation();
    const dy = startY - e.clientY;
    movedDistance = Math.max(movedDistance, Math.abs(dy));
    if (movedDistance < 4) return;
    const rect = cupContainer.getBoundingClientRect();
    store.set(channel, dragValue(startValue, startY, e.clientY, rect.height));
  }

  function handlePointerUp(e) {
    if (e.pointerId !== activePointerId) return;
    e.preventDefault();
    e.stopPropagation();
    // A tap (no meaningful drag) sets the absolute value at the click point.
    if (movedDistance < 4) {
      store.set(channel, valueFromClientY(e.clientY));
    }
    activePointerId = null;
    try {
      cupContainer.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }

  cupContainer.addEventListener('pointerdown', handlePointerDown, true);
  cupContainer.addEventListener('pointermove', handlePointerMove, true);
  cupContainer.addEventListener('pointerup', handlePointerUp, true);
  cupContainer.addEventListener('pointercancel', handlePointerUp, true);

  // Buttons ±1
  btnMinus.addEventListener('click', () => {
    store.set(channel, store.get()[channel] - 1);
  });
  btnPlus.addEventListener('click', () => {
    store.set(channel, store.get()[channel] + 1);
  });

  // Keyboard navigation when focused
  cupContainer.addEventListener('keydown', e => {
    const current = store.get()[channel];
    let step = 1;
    if (e.shiftKey) step = 16;
    if (e.altKey) step = 64;

    let newVal = current;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      newVal = current + step;
      e.preventDefault();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      newVal = current - step;
      e.preventDefault();
    } else if (e.key === 'PageUp') {
      newVal = current + 64;
      e.preventDefault();
    } else if (e.key === 'PageDown') {
      newVal = current - 64;
      e.preventDefault();
    } else if (e.key === 'Home') {
      newVal = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      newVal = 255;
      e.preventDefault();
    }
    if (newVal !== current) {
      store.set(channel, newVal);
    }
  });

  srInput.addEventListener('input', e => {
    store.set(channel, parseInt(e.target.value, 10));
  });

  return {
    destroy() {
      unsubscribe();
    }
  };
}
