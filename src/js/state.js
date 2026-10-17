import { clamp } from './util.js';

export function createColorStore(initial = { r: 0, g: 0, b: 0 }) {
  const state = {
    r: clamp(initial.r ?? 0, 0, 255),
    g: clamp(initial.g ?? 0, 0, 255),
    b: clamp(initial.b ?? 0, 0, 255)
  };
  const subs = new Set();
  const emit = () => subs.forEach(fn => fn({ ...state }));

  return {
    get: () => ({ ...state }),
    set(channel, value) {
      if (!['r', 'g', 'b'].includes(channel)) return;
      const val = clamp(value, 0, 255);
      if (state[channel] !== val) {
        state[channel] = val;
        emit();
      }
    },
    setRGB(r, g, b) {
      const nr = clamp(r, 0, 255);
      const ng = clamp(g, 0, 255);
      const nb = clamp(b, 0, 255);
      if (state.r !== nr || state.g !== ng || state.b !== nb) {
        state.r = nr;
        state.g = ng;
        state.b = nb;
        emit();
      }
    },
    subscribe(fn) {
      subs.add(fn);
      fn({ ...state });
      return () => subs.delete(fn);
    }
  };
}
