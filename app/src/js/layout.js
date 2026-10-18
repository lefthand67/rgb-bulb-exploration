export const DESKTOP = {
  name: 'landscape',
  width: 1280,
  height: 720,
  margin: 0.04,
};

export const PORTRAIT = {
  name: 'portrait',
  width: 720,
  height: 1280,
  margin: 0.02,
};

// Portrait mode is for touch phones and tablets, not portrait desktop monitors.
export function getLayoutMode(viewportWidth, viewportHeight, isTouch) {
  return isTouch && viewportWidth <= 900 && viewportHeight > viewportWidth
    ? 'portrait'
    : 'landscape';
}

export function getLayoutConfig(mode) {
  return mode === 'portrait' ? PORTRAIT : DESKTOP;
}

export function isTouchDevice({ maxTouchPoints = 0, coarsePointer = false } = {}) {
  return maxTouchPoints > 0 || coarsePointer;
}

export function detectTouch() {
  return isTouchDevice({
    maxTouchPoints: navigator.maxTouchPoints || 0,
    coarsePointer:
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
  });
}


// The title-slide bulb animation drives a per-frame colour-store update. It is
// a deliberate desktop "wow" effect, but it must not run on touch devices where
// continuous SVG repainting has hung Android/Yandex Browser renderers.
export function shouldAnimateIntro(isTouch, prefersReducedMotion) {
  return !isTouch && !prefersReducedMotion;
}
