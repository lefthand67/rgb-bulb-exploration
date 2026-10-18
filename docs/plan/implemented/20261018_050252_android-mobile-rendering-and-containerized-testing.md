# Plan: Responsive desktop/mobile rendering, Android touch fixes, and container-only TDD

- **ID / filename:** `20261018_050252_android-mobile-rendering-and-containerized-testing.md`
- **Date:** 2026-10-18
- **Status:** Implemented and verified (2026-10-18)
- **Depends on / cross-references:**
  - `docs/plan/implemented/20261018_023540_084f6a85_standalone-offline-single-file-presentation.md` — `web/index.html` must stay a single self-contained file that can be sent via messengers and opened offline.
  - `docs/plan/implemented/20261018_030423_573e1977_deck-polish-system-theme-bulb-brightness-slides.md` — system theme, the desktop 1280 × 720 Reveal canvas, and the current `@media (max-width: 900px)` layout rules.
  - `docs/plan/implemented/20261018_040921_4c5c12fa_rgb-concept-bulb-off-cube-collapse-challenge-colors.md` — current playground, switch, cube, myth, and challenge layouts.
  - `README.md` — Part B currently instructs host Node/Firefox usage. This plan replaces that development workflow with Podman.
- **Owner:** (assign)
- **Language of deliverable UI:** Russian for every child-facing string; code, tests, comments, and this plan in English.
- **Scope:** responsive portrait layout for Android, Android touch hardening, layout-aware container tests, and a container-only development workflow. Desktop visual design must not change. No new runtime dependencies. No host installs.

---

## 1. One-paragraph summary

The deck is a Reveal.js 6 presentation with a fixed desktop canvas of **1280 × 720**. Desktop rendering is good and must stay unchanged. Android phones are the problem:

1. Reveal.js 6 automatically switches to **scroll view** when the presentation width is **≤ 435 CSS px**. Most Android phones report 360–430 CSS px in portrait, so the deck silently loses its controls, slide counter, horizontal swipe navigation, and normal slide transitions.
2. The existing `@media (max-width: 900px)` rules reflow the *inside* of the fixed 1280 × 720 canvas into columns. The result is taller than 720 px and is clipped by `.reveal .slides section { overflow: hidden }`; on the playground slide the bulb, presets, and part of the layout disappear.
3. Even without clipping, scaling a 1280 × 720 canvas to a 360 px-wide phone makes text roughly 8–9 CSS px and a cup drag target about **21 × 61 CSS px** — not usable by a child.

The previous draft of this plan proposed a “rotate your phone” overlay. **That is rejected.** The requirement is a genuinely responsive web page:

- **Desktop / large tablet landscape:** keep the current 1280 × 720 design exactly as it is.
- **Phone / small tablet portrait:** switch Reveal to a portrait canvas (720 × 1280), add a `data-layout="portrait"` CSS mode, and reflow every slide vertically with larger text and touch targets.
- **Phone landscape:** keep the desktop 1280 × 720 layout, but enlarge touch controls on coarse-pointer devices.
- **All functionality stays:** cups, bulb switch, cube slider, challenge game, presets, fragments, and swipe navigation.
- **Single-file delivery stays:** the same `web/index.html` works from `file://` and can be sent via messengers.
- **Android baseline:** **Android 10+ (API 29) / Chromium 84+ (2020)** with WebView updated through the Play Store. Avoid CSS and JS features introduced after 2020.
- **Manual smoke-test device:** the operator's **Samsung A65**. Record the exact model, Android version, and Chrome/WebView version when performing the test.
- **Testing and development:** everything runs in Podman. TDD is mandatory: write the failing container test first, then implement.

---

## 2. Evidence — measured on the current build

All measurements below were taken in a temporary Podman Debian container with Chromium 155 and ChromeDriver, using Chrome mobile emulation (Android Pixel 7 user agent, `devicePixelRatio: 2.75`) against `file:///work/web/index.html`. The ad-hoc container was removed after the investigation.

### 2.1 Reveal automatically enters scroll view on phones

| Emulated viewport | `Reveal.isScrollView()` | `.controls` CSS `display` | Horizontal swipe changes slide? |
|---|---|---|---|
| 360 × 800 | **true** | **none** | **no** |
| 434 × 800 | **true** | **none** | not tested |
| 435 × 800 | **true** | **none** | not tested |
| 500 × 800 | false | block | yes |
| 800 × 360 (landscape) | false | block | yes |
| 1280 × 720 (desktop) | false | block | yes |

Root cause in `node_modules/reveal.js/dist/reveal.mjs` (Reveal.js 6.0.2):

```js
view: null,
scrollActivationWidth: 435,
```

and:

```js
function Qe() {
  if (D.wrapper && !f.disableLayout && !L.isActive()
      && typeof f.scrollActivationWidth == "number"
      && f.view !== "scroll") {
    let e = $e();
    e.presentationWidth > 0 && e.presentationWidth <= f.scrollActivationWidth
      ? I.isActive() || (F.create(), I.activate())
      : I.isActive() && I.deactivate();
  }
}
```

Setting only `view: 'slide'` is **not** enough: the auto-activation branch still runs whenever `view !== 'scroll'` and `scrollActivationWidth` is a number. The switch must be **`scrollActivationWidth: 0`** (or `null`).

In scroll view, Reveal's own CSS also hides the controls and slide number:

```css
.reveal-viewport.reveal-scroll .controls,
.reveal-viewport.reveal-scroll .progress,
.reveal-viewport.reveal-scroll .slide-number {
  display: none !important;
}
```

That matches the current Android symptom: the deck appears “stuck” and cannot be navigated as the README promises.

### 2.2 Viewport media queries reflow the fixed canvas and clip slides

At 360 × 800, the presentation is still internally 1280 × 720, but `@media (max-width: 900px)` applies because the *browser viewport* is narrow. Measured section content heights (unscaled CSS px inside the 720 px canvas):

| Slide | Heading | `scrollHeight` | Result at 360 × 800 |
|---|---|---|---|
| 3 | `🔌 0 и 255: выключатель света` | **925** | the `switch-aha` fragment is clipped below the slide |
| 4 | `🔬 Цветовая лаборатория` | **1124** | bulb, caption, and presets are clipped; only cups + top of the bulb remain |
| 7 | `🧊 Три чашки: от квадрата к кубу` | 749 | slightly clipped |
| 6 | `🖼️ Две чашки: 256 × 256 = 65 536` | 720 | exactly at the limit |
| 0–2, 5, 8–10 | other slides | ≤ 632 | fit |

Root cause in `app/src/css/components.css`:

```css
@media (max-width: 900px) {
  .lab-container { flex-direction: column; gap: 20px; }
  .challenge-row { gap: 16px; }
}

@media (max-width: 900px) {
  .switch-slide .switch-stage { grid-template-columns: 1fr; gap: 20px; }
  .switch-slide .switch-controls { min-width: 0; width: 100%; }
}
```

These are browser-viewport breakpoints, not slide-canvas breakpoints. They make the content taller while the 720 px slide height and `overflow: hidden` stay unchanged.

### 2.3 The scaled canvas makes child controls tiny

At 360 × 800, the scale is approximately `360 / 1280 = 0.281`. Measured physical sizes:

- `.cup-container` for the red cup: **21 × 61 CSS px** on screen.
- `.cup-btn` buttons: roughly **12 × 12 CSS px** on screen.
- Body text: roughly **8–9 CSS px**.

Cup dragging technically works (a touch drag changed the red cup from 127 to 255 in the probe), but the target is far too small for a 9-year-old on a phone.

### 2.4 Touch/gesture risks in the current code

- `app/src/js/cup.js` treats `pointercancel` exactly like `pointerup`. On Android, a browser gesture can cancel pointer capture. If the pointer had not moved 4 px before cancellation, `handlePointerUp` writes a new cup value (`valueFromClientY`) — an accidental value change. `pointercancel` should release the pointer without committing a tap.
- `.cup-wrapper { touch-action: none; }` disables scrolling for the whole cup wrapper, including the label and value pill. Only the draggable cup surface needs `touch-action: none`.
- There is no `overscroll-behavior: none`, so a vertical swipe near the top/bottom can trigger Android pull-to-refresh while the child is trying to interact with the deck.
- There is no explicit `touch-action: manipulation` on buttons/chips/switch, so Android may apply the historic tap delay or interpret double-taps as zoom.

### 2.5 Current test workflow is host-based and cannot catch these issues

`README.md` asks the developer to install Node/Firefox on the host and run headless Firefox with a WebDriver BiDi port. It does not test Android viewports, mobile emulation, touch events, scroll-view activation, or the single-file `web/index.html` on a phone-like viewport. The repository has no container definition.

`scripts/check-visuals.mjs` and `scripts/check-centering.mjs` also depend on a host Firefox BiDi session. They must be ported into the containerized test suite or retired; they cannot remain the required visual checks.

---

## 3. Goals and non-goals

### Goals

1. **Desktop is unchanged** at normal desktop sizes (1280 × 720 and larger): same layout, typography, colours, and interactions.
2. **Portrait Android phones and small tablets get a real responsive layout:** one slide per screen, readable text, large touch targets, no clipping, all widgets usable.
3. **Landscape Android phones keep the desktop 1280 × 720 layout** (scaled to fit), with enlarged touch targets where they fit.
4. **All functionality is preserved on mobile:** cup dragging, bulb switch, cube blue slider, challenge game, presets, fragments, and swipe navigation.
5. **The single-file deliverable stays:** `web/index.html` remains self-contained, works from `file://`, and can be sent via messengers.
6. **Nothing is installed on the host:** development, unit tests, browser tests, packaging, and screenshots all run in Podman.
7. **TDD regression protection:** the container suite fails on the current code and passes after the fix.
8. **Android baseline:** **Android 10+ (API 29) / Chromium 84+ (2020)**, with no dependency on `dvh`, `:has`, container queries, or `aspect-ratio`.

### Non-goals

- iOS Safari, desktop Safari, or Firefox-specific testing. The target is Android Chromium. Desktop Chrome/Firefox should keep working, but the automated matrix is Android Chromium + desktop Chromium.
- A native Android app, PWA, service worker, or app-store packaging.
- Replacing Reveal.js or changing the desktop visual design.
- Changing the pedagogical content, slide order, or colour semantics.
- A full visual redesign of every slide on desktop.
- Automated testing on physical hardware; the operator will do a manual smoke test on a **Samsung A65** (portrait and landscape).

---

## 4. Design

### 4.1 Layout modes

Add a small pure module, `app/src/js/layout.js`:

```js
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
```

Rules:

- **Portrait:** touch device, width ≤ 900, and height > width. Use 720 × 1280.
- **Landscape/desktop:** everything else. Use 1280 × 720. A narrow desktop window keeps the landscape canvas and must not be mistaken for a phone.
- Set `document.documentElement.dataset.layout = mode` before Reveal initializes.
- Set `document.documentElement.dataset.touch` at the same time. CSS uses `html[data-layout="portrait"]` and `html[data-touch="true"]`; desktop selectors stay untouched.

Touch detection:

```js
const isTouch = navigator.maxTouchPoints > 0
  || window.matchMedia('(pointer: coarse)').matches;
```

To avoid a flash of the desktop layout on mobile, set `data-layout` and `data-touch` in a tiny inline classic script in `<head>` before the module bundle runs. Keep the same small detection function in one place if possible; otherwise document the duplication and cover it with the same unit tests.

This keeps desktop behaviour unchanged while giving phones a real portrait canvas. At 360 × 800, the portrait canvas scales to ~0.5, giving ~17 px base text and 44 px touch targets when the virtual controls are 88 px.

### 4.2 Reveal configuration and orientation changes

In `app/src/js/main.js`, initialize Reveal from the current layout:

```js
const isTouch = navigator.maxTouchPoints > 0
  || window.matchMedia('(pointer: coarse)').matches;
const initialMode = getLayoutMode(window.innerWidth, window.innerHeight, isTouch);
document.documentElement.dataset.layout = initialMode;
document.documentElement.dataset.touch = String(isTouch);
const initialLayout = getLayoutConfig(initialMode);

Reveal.initialize({
  // Reveal 6 auto-enters scroll view at <= 435px presentation width.
  // That hides controls and breaks horizontal swipe navigation on phones.
  view: 'slide',
  scrollActivationWidth: 0,
  touch: true,

  hash: useHash,
  history: false,
  slideNumber: 'c/t',
  controls: true,
  progress: true,
  transition: 'slide',
  backgroundTransition: 'fade',

  width: initialLayout.width,
  height: initialLayout.height,
  margin: initialLayout.margin,
  minScale: 0.2,
  maxScale: 1.6,
});
```

On `resize` and `orientationchange`, debounce ~150 ms:

```js
const nextMode = getLayoutMode(window.innerWidth, window.innerHeight, isTouch);
if (nextMode !== currentMode) {
  currentMode = nextMode;
  document.documentElement.dataset.layout = nextMode;
  const { width, height, margin } = getLayoutConfig(nextMode);
  Reveal.configure({ width, height, margin });
  Reveal.layout();
}
```

`Reveal.configure()` is supported by Reveal 6 and internally calls layout/sync. Preserve the current slide; do not reload the page. Add an e2e test that rotates from portrait to landscape and back and asserts:

- `data-layout` changes;
- the current slide index is preserved;
- controls remain visible;
- no clipping occurs in either mode.

If `Reveal.configure()` proves unstable in the container, the fallback is a controlled reload that saves the current indices in `sessionStorage` and restores them after load. Prefer the configure path.

### 4.3 Portrait CSS layout

Add `app/src/css/responsive.css`, imported after `components.css` in `main.js`. All rules are scoped to the portrait mode or to coarse-pointer mobile landscape.

Base portrait rules:

```css
html[data-layout="portrait"] .reveal {
  font-size: 34px; /* ~17px physical at 360x800 */
}

html[data-layout="portrait"] .reveal .slides section {
  padding: 24px 20px;
}

html[data-layout="portrait"] .reveal h2 {
  font-size: 1.35em;
}

html[data-layout="portrait"] .reveal p,
html[data-layout="portrait"] .reveal li {
  font-size: 1.05em;
}
```

Row-to-column reflows:

```css
html[data-layout="portrait"] .bulb-intro-row,
html[data-layout="portrait"] .lab-container,
html[data-layout="portrait"] .challenge-row {
  flex-direction: column;
  gap: 18px;
}

html[data-layout="portrait"] .switch-slide .switch-stage {
  grid-template-columns: 1fr;
  gap: 20px;
}

html[data-layout="portrait"] .switch-slide .switch-controls {
  min-width: 0;
  width: 100%;
}
```

Touch-target and widget sizing:

```css
/* Portrait phones and small tablets: ~44px physical at 0.5 scale. */
html[data-layout="portrait"] .cup-container {
  width: 88px;
  height: 280px;
}

html[data-layout="portrait"] .cup-btn {
  width: 88px;
  height: 88px;
}

html[data-layout="portrait"] .challenge-cups .cup-wrapper {
  width: auto;
}

html[data-layout="portrait"] .challenge-cups .cup-container {
  width: 88px;
  height: 260px;
}

html[data-layout="portrait"] .challenge-side {
  flex-basis: auto;
  width: 100%;
}

html[data-layout="portrait"] .preset-chip,
html[data-layout="portrait"] .light-switch,
html[data-layout="portrait"] .btn-primary,
html[data-layout="portrait"] .challenge-controls button {
  min-height: 88px;
  padding: 12px 20px;
}

html[data-layout="portrait"] .lightmix-container {
  width: 420px;
  height: 340px;
}

html[data-layout="portrait"] .lightmix-circle {
  width: 200px;
  height: 200px;
}

html[data-layout="portrait"] .lightmix-circle.red {
  top: 20px;
  left: 110px;
}

html[data-layout="portrait"] .lightmix-circle.green {
  bottom: 20px;
  left: 20px;
}

html[data-layout="portrait"] .lightmix-circle.blue {
  bottom: 20px;
  right: 20px;
}

html[data-layout="portrait"] .myth-panel--lightmix {
  width: 420px;
}

html[data-layout="portrait"] .swatch-target,
html[data-layout="portrait"] .swatch-current {
  width: 88px;
  height: 88px;
}

html[data-layout="portrait"] .bulb-container {
  width: 220px;
  height: 250px;
}

html[data-layout="portrait"] .grid2d-canvas-wrap {
  width: 400px;
  height: 400px;
}

html[data-layout="portrait"] .grid2d-axis-x {
  width: 400px;
}

/* The y-axis + canvas + preview can exceed 720px. Verify the total width and,
   if needed, move the preview below the canvas or reduce the canvas to 360px. */

html[data-layout="portrait"] .challenge-box {
  width: 100%;
  padding: 16px;
}

html[data-layout="portrait"] .cube-iso {
  width: 600px;
  max-width: 100%;
}

html[data-layout="portrait"] .chips-group {
  max-width: 100%;
}
```

These are starting values. The container tests must verify that every slide still fits inside 720 × 1280 and that important controls are at least ~44 physical CSS px. Adjust spacing/sizes based on the measurements, not guesses.

Phone landscape touch targets: keep the 1280 × 720 canvas, but enlarge controls on coarse-pointer phones where they fit:

```css
@media (max-width: 1000px) {
  html[data-touch="true"][data-layout="landscape"] .cup-container {
    width: 88px;
    height: 280px;
  }
  html[data-touch="true"][data-layout="landscape"] .cup-btn {
    width: 88px;
    height: 88px;
  }
  /* Similar overrides for switch, chips, and challenge buttons. */
}
```

Set `data-touch` in JS:

```js
const isTouch = navigator.maxTouchPoints > 0
  || window.matchMedia('(pointer: coarse)').matches;
document.documentElement.dataset.touch = String(isTouch);
```

Do not apply coarse-pointer overrides to normal desktop pointers. Enlarging preset chips in landscape can make the playground slide taller than 720 px; the no-clipping test is authoritative. If chips and cups cannot both be enlarged, prioritize the cup, switch, cube-slider, and challenge controls, and keep chips at a smaller but still usable size.

Also enlarge the Reveal controls/slide number on coarse-pointer devices if they are too small to tap, or provide a clear swipe affordance. Verify them in the e2e suite.

#### 4.3.1 Refactor inline layout styles

`app/index.html` currently contains inline layout styles that cannot be cleanly overridden by portrait CSS. Move layout-only inline styles into classes:

- Slide 1: the bulb/copy flex row → `.bulb-intro-row` and `.bulb-intro-copy`.
- Slide 9 recap: the flex column can stay, but prefer a `.recap-list` class for consistency.
- Grown-up slide: move `text-align`, `max-width`, and `font-size` into a class if portrait needs different values.
- Challenge target preview inline styles in `challenges.js`: prefer existing `.target-preview` classes and add portrait overrides.

Content-only inline styles (accent colour, small margins) may stay.

### 4.4 Touch hardening

In `app/src/js/cup.js`:

- Split pointer handlers:
  - `pointerup` → commit a tap if `movedDistance < 4`, then release capture.
  - `pointercancel` → release capture and clear `activePointerId` **without** writing a value.
- Keep relative dragging and `setPointerCapture` try/catch.
- Release capture on `lostpointercapture` if needed.

In CSS:

```css
html, body {
  overscroll-behavior: none;
  -webkit-text-size-adjust: 100%;
}

.cup-container {
  touch-action: none; /* only the draggable cup surface */
}

.cup-btn,
.preset-chip,
.light-switch,
.btn-primary,
.challenge-controls button,
input[type="range"] {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

The e2e suite must drive real touch events and verify:

- cup drag changes the value;
- `pointercancel` does not change the value;
- switch tap toggles 0 ↔ 255;
- cube slider changes the blue value;
- challenge buttons respond;
- swipe on non-interactive areas changes slides.

Also cancel long-running animations when a slide is deactivated. The current intro-bulb `requestAnimationFrame` loop checks only whether the element is in the DOM, so it keeps animating after the title slide is left. Tie the loop to `destroy()` / the present slide and add a bounded-frame regression test.

Hide `.focus-hint-banner` on touch devices (`html[data-touch="true"]`): tapping a cup currently focuses it and shows a keyboard-only hint that can cover mobile UI.

### 4.5 Viewport, safe areas, and Android 2020 constraints

In `app/index.html`:

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

Use `env(safe-area-inset-*)` for fixed UI if any remains. There is no rotate overlay in this design.

The e2e harness must enable touch emulation explicitly via CDP (`Emulation.setTouchEmulationEnabled` and `Emulation.setDeviceMetricsOverride`) before loading the page, so `data-touch`, `pointer: coarse`, and real touch events behave as on Android. Do not assume Selenium's `mobileEmulation` alone sets `maxTouchPoints`.

Android 2020 baseline rules:

- Use `height: 100%` / Reveal-managed sizing, not `dvh`.
- Do not use `:has()`, container queries, `aspect-ratio`, or other features newer than Chromium 84.
- `matchMedia`, `PointerEvent`, `ResizeObserver`, flex `gap`, `min()/max()/clamp()`, and `touch-action` are allowed.
- Provide graceful degradation: the deck must still render if `backdrop-filter` is unavailable.

### 4.6 Container-only development and test workflow

No Node, npm, Chromium, ChromeDriver, Python, or Selenium on the host.

#### 4.6.1 `containers/Containerfile`

```dockerfile
FROM docker.io/library/debian:stable-slim

ENV DEBIAN_FRONTEND=noninteractive \
    CHROME_BIN=/usr/bin/chromium \
    CHROMEDRIVER=/usr/bin/chromedriver \
    CI=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      nodejs \
      npm \
      chromium \
      chromium-driver \
      python3 \
      python3-selenium \
      fonts-dejavu \
      fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /work
CMD ["bash"]
```

Debian 13 provides Node 20.19.x, Chromium 155.x, and Selenium 4.24.x. The Selenium test must use an explicit service path:

```python
from selenium.webdriver.chrome.service import Service
driver = webdriver.Chrome(service=Service("/usr/bin/chromedriver"), options=opts)
```

Chrome options:

```python
opts.binary_location = "/usr/bin/chromium"
opts.add_argument("--headless=new")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-gpu")
opts.add_argument("--disable-dev-shm-usage")
```

#### 4.6.2 `containers/run.sh`

Shell/test wrapper. Do not publish port 3000 here; tests do not need it. Add TTY flags only when stdin/stdout are terminals, so the wrapper also works from non-interactive agent runs:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="${RGB_BULB_IMAGE:-rgb-bulb-dev}"

if ! podman image exists "$IMAGE"; then
  podman build -f "$REPO/containers/Containerfile" -t "$IMAGE" "$REPO"
fi

TTY_ARGS=()
if [ -t 0 ] && [ -t 1 ]; then TTY_ARGS=(-it); fi

exec podman run --rm "${TTY_ARGS[@]}" \
  -v "$REPO:/work:Z" \
  -v rgb-bulb-node-modules:/work/node_modules \
  -v rgb-bulb-npm-cache:/root/.npm \
  "$IMAGE" "${@:-bash}"
```

#### 4.6.3 `containers/dev.sh`

Separate wrapper for the Vite server, so test runs never fight over port 3000:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="${RGB_BULB_IMAGE:-rgb-bulb-dev}"

exec podman run --rm -it \
  -v "$REPO:/work:Z" \
  -v rgb-bulb-node-modules:/work/node_modules \
  -v rgb-bulb-npm-cache:/root/.npm \
  -p 3000:3000 \
  "$IMAGE" \
  bash -lc 'npm run dev -- --host 0.0.0.0'
```

`vite.config.js` should use `server.open: !process.env.CI` so the container never tries to launch a browser.

#### 4.6.4 `containers/test.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /work

# Always reinstall: the named node_modules volume must not keep stale deps.
npm ci --no-audit --no-fund

npm test
npm run package
npm run verify:web

python3 tests/e2e/android_webdriver.py \
  --url "file:///work/web/index.html" \
  --artifacts /work/tests/e2e/artifacts

python3 tests/e2e/visual_contracts.py \
  --url "file:///work/web/index.html?e2e=1" \
  --artifacts /work/tests/e2e/artifacts

python3 tests/e2e/centering.py \
  --url "file:///work/web/index.html?e2e=1" \
  --artifacts /work/tests/e2e/artifacts
```

`npm ci` on every run is acceptable for this project size and prevents stale-volume bugs when `package-lock.json` changes.

#### 4.6.5 Port the visual contract scripts

The existing `scripts/check-visuals.mjs` and `scripts/check-centering.mjs` require host Firefox BiDi and cannot be used under the container-only rule.

Move their contracts into the Selenium suite, for example:

- `tests/e2e/visual_contracts.py` — additive light stage, bulb off/dim/on, cube collapse, challenge data.
- `tests/e2e/centering.py` — per-layout vertical centering:
  - landscape: `top === (720 - scrollHeight) / 2`;
  - portrait: `top === (1280 - scrollHeight) / 2`.

Then either:

- add these checks to `containers/test.sh`; and
- remove or deprecate the old BiDi scripts and their npm aliases.

If the old scripts are kept for local experimentation, mark them clearly as legacy and do not list them in `AGENTS.md` as required checks.

#### 4.6.6 E2E test hook

Some checks need to select arbitrary slides. The production bundle does not expose `Reveal` globally. Add a gated hook in `main.js`:

```js
if (new URLSearchParams(window.location.search).has('e2e')) {
  window.__RGB_E2E__ = { Reveal };
}
```

E2E loads `file:///work/web/index.html?e2e=1`. Also load the same file without the query parameter at least once to verify normal production behaviour.

#### 4.6.7 Test matrix and assertions

Profiles:

| Name | Viewport | Layout | Notes |
|---|---|---|---|
| phone-portrait-small | 360 × 640 | portrait | small Android phone |
| phone-portrait | 360 × 800 | portrait | common Android phone |
| phone-portrait-large | 412 × 915 | portrait | large Android phone |
| tablet-portrait | 800 × 1280 | portrait | small tablet portrait |
| phone-landscape | 640 × 360 | landscape | small landscape |
| phone-landscape-wide | 800 × 360 | landscape | common landscape |
| desktop | 1280 × 720 | landscape | regression |
| desktop-large | 1920 × 1080 | landscape | regression |

Assertions:

- `html[data-layout]` matches the expected mode.
- `.reveal-viewport` does not have `reveal-scroll`; controls and slide number are visible.
- For every top-level and nested slide:
  - portrait: `scrollHeight <= 1280` and `scrollWidth <= 720` (with a small tolerance);
  - landscape: `scrollHeight <= 720` and `scrollWidth <= 1280`.
- Key touch targets are at least ~44 physical CSS px where feasible:
  - cup container;
  - cup ± buttons;
  - light switch;
  - preset chips;
  - challenge buttons;
  - cube slider.
  Convert virtual size to physical size **only when measuring virtual CSS values**. `getBoundingClientRect()` already includes Reveal's scale transform; use its width/height directly for physical touch-target checks and do not multiply by `Reveal.getScale()` again.
- Real touch swipe advances slides/fragments.
- Cup drag changes the value; `pointercancel` does not.
- Switch tap toggles 0 ↔ 255.
- Cube slider changes `data-blue` / sheet count.
- Challenge “Проверить цвет!” and “Пропустить” respond.
- Orientation change portrait → landscape → portrait preserves the current slide and produces no clipping.
- No uncaught JavaScript errors.
- Normal load without `?e2e=1` still works and does not expose the test hook.
- Screenshots saved to `tests/e2e/artifacts/` (gitignored).

#### 4.6.8 Gitignore

Add:

```gitignore
/tests/e2e/artifacts/
```

---

## 5. Implementation order (TDD)

### Step 1 — Container harness first

1. Add `containers/Containerfile`, `containers/run.sh`, `containers/dev.sh`, `containers/test.sh`.
2. Build the image.
3. Verify `npm ci`, `npm test`, and `npm run package` run inside the container.
4. Port/retire the legacy BiDi visual scripts as described in §4.6.5.

**Exit criterion:** no host toolchain installs are needed; `web/index.html` is produced inside the container.

### Step 2 — Write the failing responsive tests

1. Capture current desktop screenshots at 1280 × 720 and 1920 × 1080 from the container. These are the regression baseline for “desktop unchanged.”
2. Add `tests/e2e/android_webdriver.py` with the matrix and assertions from §4.6.7.
3. Run it against the current `web/index.html`.
3. Capture baseline failures. Expected:
   - portrait viewports enter Reveal scroll view;
   - controls hidden;
   - swipe does not navigate in portrait;
   - slide 3 `scrollHeight = 925 > 720`;
   - slide 4 `scrollHeight = 1124 > 720`;
   - no `data-layout` switching;
   - touch targets below 44 px in portrait.

**Exit criterion:** the suite deterministically reproduces the mobile defects.

### Step 3 — Layout mode + Reveal configuration

1. Add `app/src/js/layout.js` and unit tests for `getLayoutMode()` / `getLayoutConfig()`.
2. Set `data-layout` before Reveal initialization.
3. Add `view: 'slide'`, `scrollActivationWidth: 0`, `touch: true`.
4. Add debounced orientation change handling with `Reveal.configure()` + `Reveal.layout()`.
5. Rebuild and run e2e: scroll-view and layout-mode assertions should pass; clipping/touch-size assertions will still fail.

### Step 4 — Portrait CSS and inline-style refactor

1. Add `app/src/css/responsive.css` and import it.
2. Move layout-only inline styles in `app/index.html` to classes.
3. Implement portrait reflow and touch-target sizing for every slide.
4. Add coarse-pointer landscape overrides for phone-sized screens.
5. Rebuild and run e2e; iterate until:
   - every portrait slide fits 720 × 1280;
   - every landscape slide fits 1280 × 720;
   - touch targets meet the agreed minimum where feasible.

### Step 5 — Touch hardening

1. Fix `pointercancel` handling in `cup.js`.
2. Add/adjust `touch-action`, `overscroll-behavior`, and tap-highlight rules.
3. Verify touch drag, switch, cube slider, and challenge buttons.
4. Add the `pointercancel` regression assertion.

### Step 6 — Full verification and documentation

1. Run `./containers/run.sh bash containers/test.sh`.
2. Confirm:
   - Vitest unit tests pass;
   - `npm run package` succeeds;
   - `npm run verify:web` reports a self-contained file;
   - all portrait/landscape/desktop profiles pass;
   - visual contracts and centering pass in both layout modes.
3. Inspect screenshots for portrait, landscape, and desktop.
4. Test the single file from `file://` without the `?e2e=1` hook.
5. Run a manual smoke test on the operator’s **Samsung A65** (portrait and landscape). Open the file through the messenger/file-manager flow the teacher will actually use, not only through Selenium `file://`. Record the exact model, Android version, and Chrome/WebView version. Confirm controls, swipe, cups, switch, cube slider, and challenge.
6. Update `README.md` Part B with Podman commands and a short “mobile layout” note.
7. Move this plan to `docs/plan/implemented/` after verification.

---

## 6. Acceptance criteria

- **Desktop unchanged:** 1280 × 720 and 1920 × 1080 screenshots match the current visual design; no desktop reflow.
- **Portrait responsive:** at 360 × 640, 360 × 800, 412 × 915, and 800 × 1280, `html[data-layout="portrait"]` is set, all slides fit 720 × 1280, text is readable (~17 px+), and controls are touch-sized.
- **Landscape phones:** 640 × 360 and 800 × 360 use `data-layout="landscape"`, fit 1280 × 720, and have enlarged touch targets.
- **Navigation:** Reveal remains in slide mode on all profiles (`reveal-scroll` absent); controls and slide number visible; real touch swipe advances slides/fragments.
- **All functionality:** cups, switch, cube slider, challenge, presets, and fragments work in portrait and landscape.
- **No clipping:** per-layout `scrollHeight`/`scrollWidth` assertions pass for every slide, including nested myth slides.
- **Orientation change:** rotating portrait → landscape → portrait preserves the current slide and re-lays out without clipping or reload.
- **Touch correctness:** `pointercancel` never commits a value; cup drag, switch tap, and challenge buttons work with real touch events.
- **Manual device:** the Samsung A65 smoke test passes in portrait and landscape, or any limitation is documented with the device’s Android/Chrome/WebView versions.
- **Single file:** `npm run package` produces one self-contained `web/index.html`; `verify:web` passes; `file://` works offline; no external URLs or source maps.
- **Container isolation:** all tests run via Podman; no host toolchain packages; generated files/artifacts are not staged.
- **Documentation:** README Part B and `AGENTS.md` describe the container workflow and responsive layout rules.

---

## 7. Risks and rollbacks

| Risk | Mitigation |
|---|---|
| Portrait content is taller than 720 × 1280. | The e2e suite enforces per-slide `scrollHeight` limits; adjust portrait CSS spacing/sizes until every slide fits. Do not hide overflow with internal scrolling unless explicitly approved. |
| `Reveal.configure({ width, height })` on orientation change destabilizes layout. | Test it first. Fallback: reload and restore saved slide indices; keep the same public URL/file. |
| Touch targets become so large that slides overflow. | Enforce both touch-target and no-clipping assertions; tune component sizes per slide. |
| Coarse-pointer landscape overrides change tablet or touch-laptop layout. | Scope them to `max-width: 1000px` and `data-layout="landscape"`, and test 1280 × 800 tablet landscape. |
| Android 2020 WebView lacks a CSS feature. | Baseline is Android 10+ / Chromium 84+; avoid `dvh`, `:has`, container queries, and `aspect-ratio`. The container runs current Chromium, so 2020 compatibility is enforced by feature restrictions plus the manual Samsung A65 smoke test. |
| Messenger/file-manager opening may not behave like `file://` in Chrome. | Test the actual “save attachment → open with Chrome” flow on the Samsung A65; document the supported path in README Part A. |
| Long-running intro animation drains battery after leaving the title slide. | Cancel the `requestAnimationFrame` loop in `destroy()` or when the slide is no longer present; add a bounded-frame regression. |
| Porting the BiDi visual scripts changes their semantics. | Preserve the same contracts in the Selenium suite; compare against existing expected values (dark stage, pure RGB circles, bulb states, one-sheet cube). |
| Stale `node_modules` volume. | Run `npm ci` on every `containers/test.sh` invocation. |
| E2E hook leaks into production. | Expose only when `?e2e=1` is present; test the normal URL without the hook. |

Rollback:

- Layout mode: revert `layout.js` usage and set `data-layout` off; desktop remains unaffected.
- Reveal config: restoring the old config re-enables the current (broken) phone behaviour.
- Portrait CSS: removing `responsive.css` restores desktop-only rendering.
- Container harness: all changes are additive and can be removed without touching `app/`.

---

## 8. Follow-ups (not part of this plan)

1. **iOS Safari support.** Requires WebKit testing in the container or a real-device matrix.
2. **Android 2020 real-device matrix.** The operator's Samsung A65 covers the primary manual case; later add at least one older Android 10/11 device and one with an older updatable WebView.
3. **Hosted/PWA delivery.** Not required for the messenger/file workflow.
4. **Automated screenshot diffing.** Store approved portrait/landscape/desktop screenshots and compare future builds.
5. **Compact landscape mode.** If 800 × 360 touch controls still feel too small after coarse-pointer overrides, add a dedicated landscape-mobile canvas/layout.

---

## 9. Files expected to change

| File | Change |
|---|---|
| `app/src/js/layout.js` *(new)* | Pure layout-mode/config helpers and unit-testable breakpoint logic. |
| `app/src/js/main.js` | Initial `data-layout`/`data-touch`, Reveal config, orientation-change reconfiguration, gated e2e hook, cancel the intro-bulb animation when its slide is left. |
| `app/src/css/responsive.css` *(new)* | Portrait reflow, portrait touch sizing, coarse-pointer landscape overrides. |
| `app/src/css/components.css` | Remove the two viewport-width `@media (max-width: 900px)` blocks; keep desktop rules stable. |
| `app/src/js/cup.js` | Split `pointercancel` from `pointerup`; no accidental value commits. |
| `app/index.html` | `viewport-fit=cover`; move layout-only inline styles to classes. |
| `app/src/js/challenges.js` | Move layout-only inline styles to classes if needed for portrait overrides. |
| `vite.config.js` | `server.open: !process.env.CI`. |
| `tests/unit/layout.test.js` *(new)* | Unit tests for `getLayoutMode()` / `getLayoutConfig()`. |
| `tests/e2e/android_webdriver.py` *(new)* | Container-only responsive/touch/visual test suite and screenshots. |
| `containers/Containerfile` *(new)* | Debian + Node + Chromium + ChromeDriver + Selenium. |
| `containers/run.sh` *(new)* | Shell/test Podman wrapper without published ports. |
| `containers/dev.sh` *(new)* | Vite dev wrapper publishing port 3000. |
| `containers/test.sh` *(new)* | `npm ci` + unit + package + verify + e2e. |
| `scripts/check-visuals.mjs`, `scripts/check-centering.mjs` | Port contracts to `tests/e2e/`, then retire or mark legacy. |
| `package.json` | Remove/update legacy visual-check aliases if the scripts are retired. |
| `.gitignore` | Ignore `tests/e2e/artifacts/`. |
| `AGENTS.md` | Update container commands, responsive layout rules, TDD checks, Android baseline. |
| `README.md` | Podman workflow; mobile layout note; remove host install instructions for this workflow. |
| `docs/plan/implemented/...` | Move this plan here after implementation. |


---

## 10. Implementation result (2026-10-18)

Implemented in this order:

- Added the Podman harness (`containers/Containerfile`, `run.sh`, `dev.sh`,
  `test.sh`), with `npm ci` on every test run and named volumes for
  `node_modules` and the npm cache.
- Added `app/src/js/layout.js`, `tests/unit/layout.test.js`, and the early
  inline `data-layout`/`data-touch` detection in `app/index.html`.
- Pinned Reveal to `view: 'slide'` with `scrollActivationWidth: 0`, and added
  debounced `Reveal.configure()` + `Reveal.layout()` on orientation changes.
- Added `app/src/css/responsive.css` with a 720 × 1280 portrait layout, 96 px
  virtual touch targets, coarse-pointer landscape overrides, and safe handling
  of `overscroll-behavior`.
- Split `pointercancel` from `pointerup` in `cup.js`; cancellation never
  commits a value. The intro-bulb breathing is now a compositor-only CSS
  animation scoped to the present slide, and touch devices additionally drop
  the SVG Gaussian-blur filter and the continuous title animation. This avoids
  the mobile renderer hangs reported with SVG filters in Android/Yandex
  Browser while keeping the desktop visual treatment.
- Ported the legacy Firefox BiDi contracts to Selenium:
  `tests/e2e/visual_contracts.py` and `tests/e2e/centering.py`; the old scripts
  were retired.
- Added the full `tests/e2e/android_webdriver.py` matrix with CDP touch
  emulation, real gestures, per-slide clipping checks, touch-target checks,
  orientation changes, and screenshots.
- Updated `README.md`, `AGENTS.md`, `package.json`, and `.gitignore`.

Verification command:

```bash
./containers/run.sh bash containers/test.sh
```

Result: all Vitest tests, packaging/`verify:web`, the 8-profile Android/desktop
matrix, visual contracts, and per-layout centering pass. Screenshots were
inspected in `tests/e2e/artifacts/` (gitignored).

Follow-up: `docs/plan/implemented/20261018_160001_restore-desktop-intro-bulb-wow.md`
restored the desktop title-slide breathing bulb with running RGB numbers while
keeping the touch-device renderer safeguards.

Manual Samsung A65 smoke test: not performed by the agent in this environment;
the operator should still run it in portrait and landscape through the
messenger/file-manager flow and record the exact model, Android version, and
Chrome/WebView version.
