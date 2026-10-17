export function animateCount(el, targetValue, duration = 2000) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    el.textContent = targetValue.toLocaleString('ru-RU');
    return;
  }

  let startTime = null;
  const startValue = 0;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    // Ease out expo
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const current = Math.floor(startValue + (targetValue - startValue) * easeProgress);

    el.textContent = current.toLocaleString('ru-RU');

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = targetValue.toLocaleString('ru-RU');
    }
  }

  requestAnimationFrame(step);
}
