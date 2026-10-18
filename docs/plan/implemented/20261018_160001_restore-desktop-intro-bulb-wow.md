# Plan: Restore the desktop title-slide "wow" bulb animation, keep mobile safe

- **ID / filename:** `20261018_160001_restore-desktop-intro-bulb-wow.md`
- **Date:** 2026-10-18
- **Status:** Implemented and verified (2026-10-18)
- **Depends on / cross-references:**
  - `docs/plan/implemented/20261018_050252_android-mobile-rendering-and-containerized-testing.md`
  - `app/src/js/main.js`, `app/src/js/bulb.js`, `app/src/css/components.css`
  - `tests/e2e/visual_contracts.py`, `tests/e2e/android_webdriver.py`
- **Language:** code/tests/plan in English; child-facing UI remains Russian.

---

## 1. Summary

The desktop title slide used to show a glowing bulb whose RGB/hex readout changed continuously — a deliberate "wow" effect for children. The Android/Yandex Browser safety work removed the per-frame `requestAnimationFrame` loop and replaced it with a subtle CSS transform animation. That fixed the mobile renderer risk but lost the desktop effect (the numbers no longer run).

This plan restores the original desktop effect and keeps the mobile safety rules:

- **Desktop / non-touch:** the intro bulb breathes by changing the red channel in the color store every frame; the RGB and hex numbers visibly run.
- **Touch devices (Android/Yandex Browser):** no per-frame loop, no continuous title animation, and the SVG Gaussian-blur filter stays disabled.
- **Leaving the title slide:** the loop stops immediately.
- **Reduced motion:** no per-frame animation.

---

## 2. Evidence / root cause

Current `main.js` only adds a CSS class:

```js
introBulbEl.classList.add('bulb-intro--breathing');
```

and `components.css` animates `.bulb-container` with `transform`/`opacity`. The readout is static. The old implementation ran:

```js
let step = 0;
const breathe = () => {
  step += 0.05;
  const val = Math.sin(step) * 50 + 200;
  store.set('r', val);
  if (slide.contains(introBulbEl)) requestAnimationFrame(breathe);
};
breathe();
```

The mobile safety change intentionally removed that loop because continuous SVG-filter repainting can hang Android/Yandex Browser renderers. The fix must therefore be **conditional on the device**, not a straight revert.

---

## 3. Design

### 3.1 Pure decision helper

Add to `app/src/js/layout.js`:

```js
export function shouldAnimateIntro(isTouch, prefersReducedMotion) {
  return !isTouch && !prefersReducedMotion;
}
```

Unit tests cover desktop, touch, reduced-motion desktop, and touch + reduced-motion.

### 3.2 Desktop-only loop

In `initSlide()`:

- Keep creating the bulb with `{ r: 255, g: 100, b: 0 }`.
- If `shouldAnimateIntro(isTouch, prefersReducedMotion())`, start the original breathing loop:
  - `step += 0.05`;
  - `val = Math.sin(step) * 50 + 200`;
  - `store.set('r', val)`;
  - schedule the next frame only while active.
- Register a `destroy()` component that sets `animationActive = false`, so `cleanupComponents()` stops it when the slide changes.
- On mobile or reduced motion, do not schedule any frame. The readout stays at its initial value.

Remove the now-unused `.bulb-intro--breathing` class and its CSS keyframes. The desktop effect is driven by the store again, exactly as before. The touch CSS that disables the SVG blur filter stays.

### 3.3 Tests

- Unit: `shouldAnimateIntro()` truth table.
- Desktop visual contract:
  - intro readout changes over ~0.35 s (the "numbers running" wow);
  - after leaving slide 0, the readout stops changing.
- Touch e2e (portrait/landscape profiles):
  - intro readout stays constant over time (no per-frame loop);
  - computed animation name is `none`;
  - bulb SVG blur filter is `none`.

The new desktop contract must fail against the current build before implementation.

---

## 4. TDD order

1. Add `tests/unit/layout.test.js` cases for `shouldAnimateIntro()`; observe the missing export failure.
2. Update `tests/e2e/visual_contracts.py` to require a changing desktop intro readout; run it against the current `web/index.html` and capture the failure.
3. Add the touch readout-stability assertion to `tests/e2e/android_webdriver.py`.
4. Implement the helper and desktop-only loop; remove the CSS breathing rule.
5. Rebuild, run focused visual/Android checks, then the full `containers/test.sh`.
6. Inspect desktop and mobile title-slide screenshots.
7. Move this plan to `docs/plan/implemented/` and update the parent plan note.

---

## 5. Acceptance criteria

- Desktop title slide: RGB and hex readout change continuously; bulb color visibly breathes.
- Desktop: leaving slide 0 stops the loop; returning re-initializes it.
- Touch portrait/landscape: readout is static, no CSS animation, no SVG blur filter.
- Reduced motion: readout is static.
- `npm test`, `npm run package`, `verify:web`, Android matrix, visual contracts, and centering all pass in the container.
- Desktop visual design outside the title slide is unchanged.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Reintroducing mobile GPU hang | Loop is gated by touch detection and reduced motion; mobile keeps filter/animation disabled and is covered by e2e. |
| Duplicate animation from CSS + JS | Remove the CSS breathing rule and class entirely. |
| Loop survives slide change | Keep the `destroy()` stopper and assert the readout stabilizes after leaving slide 0. |
| FPS-dependent speed | Preserve the original step-based behavior; the effect is cosmetic. |

## 7. Files expected to change

- `app/src/js/layout.js` — `shouldAnimateIntro()`.
- `app/src/js/main.js` — desktop-only intro loop and cleanup.
- `app/src/css/components.css` — remove the CSS breathing keyframes/rule.
- `tests/unit/layout.test.js` — helper truth table.
- `tests/e2e/visual_contracts.py` — desktop running-readout contract.
- `tests/e2e/android_webdriver.py` — touch static-readout contract.
- `docs/plan/implemented/...` — move this plan after verification.


---

## 8. Implementation result

- Added `shouldAnimateIntro(isTouch, prefersReducedMotion)` in `layout.js` with unit coverage.
- Restored the desktop per-frame red-channel breathing loop in `initSlide()`, with the existing `destroy()` cleanup so leaving slide 0 stops it.
- Removed the temporary CSS `.bulb-intro--breathing` animation/keyframes.
- Mobile still skips the loop; the touch CSS still removes the SVG Gaussian-blur filter.
- Updated contracts:
  - desktop: RGB/hex readout changes while slide 0 is present, then stabilizes after leaving;
  - touch: readout stays static, no CSS title animation, no SVG blur filter.
- Full `containers/test.sh` passes: 63 unit tests, package/`verify:web`, 8-profile touch/desktop matrix, visual contracts, centering.
