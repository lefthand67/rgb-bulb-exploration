import { clamp } from './util.js';

/** The bulb emits light when at least one channel is above zero. */
export const isLightOn = ({ r = 0, g = 0, b = 0 } = {}) => r > 0 || g > 0 || b > 0;

/**
 * Drive the switch by a single brightness value: 0 = off, 255 = full.
 * Anything else (as in "the bulb is on") is treated as an on-state and
 * switches off next. The store is always the source of truth.
 */
export const nextSwitchValue = (current) => (current > 0 ? 0 : 255);

/**
 * Big light switch bound to a color store. The switch itself never keeps
 * state — it reads `isLightOn(store.get())` on every store notification,
 * so programmatic changes from other components stay in sync.
 * Russian copy comes from `data-*` attributes (one place to translate).
 */
export function createLightSwitch({ mountEl, store, stepsEl, valueEl, captionEl } = {}) {
  const labelOn = mountEl.dataset.labelOn ?? 'Вкл';
  const labelOff = mountEl.dataset.labelOff ?? 'Выкл';
  const captionOn = captionEl?.dataset.textOn ?? 'ярче всего!';
  const captionOff = captionEl?.dataset.textOff ?? 'свет выключен';

  const label = mountEl.querySelector('.light-switch__label');
  const marker = stepsEl ? stepsEl.querySelector('[data-steps-marker]') : null;

  const render = () => {
    const on = isLightOn(store.get());

    mountEl.setAttribute('aria-checked', on ? 'true' : 'false');
    mountEl.classList.toggle('is-on', on);
    if (label) label.textContent = on ? labelOn : labelOff;
    if (valueEl) valueEl.textContent = on ? '255' : '0';
    if (captionEl) captionEl.textContent = on ? captionOn : captionOff;
    if (marker) marker.style.left = on ? '100%' : '0%';
  };

  const toggle = () => {
    // Exactly two states: {0,0,0} and {255,255,255}. If some future slide
    // pre-loads a partial color, the store-derived rule snaps to an endpoint.
    if (isLightOn(store.get())) store.setRGB(0, 0, 0);
    else store.setRGB(255, 255, 255);
  };

  const handleClick = () => toggle();
  const handleKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  };
  mountEl.addEventListener('click', handleClick);
  mountEl.addEventListener('keydown', handleKey);

  const unsubscribe = store.subscribe(render);
  render();

  return {
    toggle,
    destroy() {
      unsubscribe();
      mountEl.removeEventListener('click', handleClick);
      mountEl.removeEventListener('keydown', handleKey);
    }
  };
}

export { clamp };