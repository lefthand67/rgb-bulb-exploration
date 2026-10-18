# AGENTS.md — Operating rules for this repository

This file is the entry point for any AI agent working on the **RGB Cups / 16 million colours** presentation. Read it before editing code, running tests, or installing anything.

---

## 1. Project identity

- **What it is:** an interactive Reveal.js slide deck for children (~9 years old) explaining additive RGB colour and why an RGB bulb has 16 777 216 colours.
- **Source of truth:** `app/` — HTML, CSS, and JavaScript live here.
- **Build output:**
  - `web/index.html` — the **single-file, offline teacher deliverable** produced by `npm run package`.
  - `dist/` — optional multi-file build produced by `npm run build`.
- **Never edit generated output by hand:** `web/` and `dist/` are generated and gitignored.
- **Language:** all child-facing UI strings are **Russian**. Code, comments, tests, plans, and this file are **English**.
- **Runtime dependencies are deliberately small:** Reveal.js, `canvas-confetti`, and bundled fonts. Do not add a runtime dependency without a plan and explicit approval.
- **Supported delivery:** a single `web/index.html` that works from `file://` and can be sent via messengers.
- **Supported browsers:** Android Chromium (Chrome, Samsung Internet, WebView) and desktop Chromium/Firefox. The automated Android baseline is **Android 10+ (API 29) / Chromium 84+ (2020)**. The container runs current Chromium, so 2020 compatibility is enforced by avoiding newer CSS/JS features plus the manual Samsung A65 smoke test. iOS Safari is out of scope unless explicitly planned.

---

## 2. Non-negotiable environment rule: containers only

**Do not install Node, npm, Chromium, Firefox, ChromeDriver, Selenium, Playwright, or browser test tooling on the host.**

Every project command that needs a toolchain must run inside the project's Podman container.

- Build the image once (the wrappers also build it automatically):
  ```bash
  podman build -f containers/Containerfile -t rgb-bulb-dev .
  ```
- Open a development/test shell:
  ```bash
  ./containers/run.sh
  ```
- Run the full test/build suite non-interactively:
  ```bash
  ./containers/run.sh bash containers/test.sh
  ```
- Run a single command inside the container:
  ```bash
  ./containers/run.sh bash -lc 'npm test'
  ```
- Start the Vite dev server from inside the container:
  ```bash
  ./containers/dev.sh
  ```
  Then open `http://localhost:3000` on the host.

The container image is based on `docker.io/library/debian:stable-slim` and contains Node, Chromium, ChromeDriver, Python, Selenium, and emoji fonts. The exact definition is in `containers/Containerfile`.

### If the container harness does not exist yet

The responsive/android plan introduces:

- `containers/Containerfile`
- `containers/run.sh`
- `containers/dev.sh`
- `containers/test.sh`

Source of truth:

> `docs/plan/implemented/20261018_050252_android-mobile-rendering-and-containerized-testing.md`

**Creating that harness is the first step of any task that needs tests.** Do not fall back to host `npm`, `npx`, `node`, `python3`, Chrome, or Firefox. If the harness is missing and the task does not yet include it, stop and add the harness first.

### Volume rules

- `node_modules` and the npm cache live in **named Podman volumes**, not on the host.
- The repository is bind-mounted at `/work`.
- Generated `web/`, `dist/`, and test artifacts may be written through the bind mount.
- `containers/test.sh` must run `npm ci` on every invocation so a named volume cannot keep stale dependencies after `package-lock.json` changes.
- Never commit `node_modules/`, `web/`, `dist/`, `.vite/`, `tests/e2e/artifacts/`, or screenshots.

---

## 3. Mandatory TDD workflow

Every behaviour change follows this loop:

1. **Write the test first.**
   - Pure logic → `tests/unit/*.test.js` with Vitest.
   - DOM/layout/touch/mobile behaviour → `tests/e2e/` with Selenium + ChromeDriver.
   - Visual/centering contracts → the containerized e2e suite.
2. **Run it inside the container and observe the intended failure.**
3. **Implement the minimum code to make the test pass.**
4. **Run the focused test again, then the full suite.**
5. **Refactor only with a green suite.**
6. **Record the result** in the task notes/plan or commit message.

For mobile work, the tests must cover:

- portrait and landscape viewports;
- real touch events (`Input.dispatchTouchEvent`), not only mouse clicks;
- swipe navigation;
- cup dragging;
- switch/challenge taps;
- cube slider;
- Reveal scroll-view activation;
- per-layout content clipping;
- touch-target sizes;
- orientation changes;
- console errors.

### Baseline evidence is part of the job

For bug fixes, run the new test against the **current** code first and capture the failure. Example from the Android investigation:

- `Reveal.isScrollView() === true` at 360 × 800;
- controls hidden;
- slide 3 `scrollHeight = 925` and slide 4 `scrollHeight = 1124` inside a 720 px canvas.

Do not “fix” a defect without first demonstrating that the test catches it.

---

## 4. Required checks before claiming completion

Run all of these in the container:

```bash
./containers/run.sh bash containers/test.sh
```

That script must run, at minimum:

```bash
npm ci
npm test
npm run package
npm run verify:web
python3 tests/e2e/android_webdriver.py \
  --url file:///work/web/index.html \
  --artifacts /work/tests/e2e/artifacts
python3 tests/e2e/visual_contracts.py \
  --url 'file:///work/web/index.html?e2e=1' \
  --artifacts /work/tests/e2e/artifacts
python3 tests/e2e/centering.py \
  --url 'file:///work/web/index.html?e2e=1' \
  --artifacts /work/tests/e2e/artifacts
```

### Mobile/desktop matrix

| Profile | Viewport | Expected layout |
|---|---|---|
| phone-portrait-small | 360 × 640 | portrait |
| phone-portrait | 360 × 800 | portrait |
| phone-portrait-large | 412 × 915 | portrait |
| tablet-portrait | 800 × 1280 | portrait |
| phone-landscape | 640 × 360 | landscape |
| phone-landscape-wide | 800 × 360 | landscape |
| desktop | 1280 × 720 | landscape |
| desktop-large | 1920 × 1080 | landscape |

Required assertions:

- `html[data-layout]` matches the expected mode.
- `.reveal-viewport` does not have `reveal-scroll`; controls and slide number are visible.
- Every top-level and nested slide fits its canvas:
  - portrait: `scrollHeight <= 1280`, `scrollWidth <= 720`;
  - landscape: `scrollHeight <= 720`, `scrollWidth <= 1280`.
- Key touch targets are at least ~44 physical CSS px where feasible. `getBoundingClientRect()` already includes Reveal's scale transform; use its dimensions directly and do not multiply by `Reveal.getScale()` again.
- Real touch swipe advances slides/fragments.
- Cup drag changes the value; `pointercancel` does not.
- Switch, cube slider, challenge buttons, and presets respond.
- Rotating portrait → landscape → portrait preserves the current slide and stays unclipped.
- No uncaught JavaScript errors.
- Normal load without `?e2e=1` works and does not expose the test hook.
- The single file loads from `file://` offline.

### Visual and centering contracts

The old host-Firefox BiDi scripts were retired. Their contracts now live in the
container e2e suite:

- `tests/e2e/visual_contracts.py` — additive light stage, bulb states, cube
  collapse, challenge data.
- `tests/e2e/centering.py` — per-layout vertical centering.

Do not add host-Firefox checks or run them on the host as a substitute for the
container suite.

### Definition of Done

A task is done only when all are true:

- [ ] A failing test existed before the implementation.
- [ ] The full unit suite passes in the container.
- [ ] The single-file build passes `verify:web`.
- [ ] Portrait/landscape/desktop e2e checks pass for the affected slides.
- [ ] Touch-target and no-clipping assertions pass.
- [ ] Screenshots were inspected.
- [ ] The manual Samsung A65 smoke test passed in portrait and landscape (or its absence is explicitly reported).
- [ ] The single file works from `file://` without `?e2e=1`.
- [ ] The single file opens through the messenger/file-manager flow on the Samsung A65.
- [ ] No host toolchain packages were installed.
- [ ] No generated files or test artifacts are staged for commit.
- [ ] `README.md` is updated if the developer workflow changed.
- [ ] The plan is updated/moved to `docs/plan/implemented/` when complete.

---

## 5. Planning rules

- Every multi-step change gets a plan in `docs/plan/` using the existing convention:
  ```text
  YYYYMMDD_HHMMSS_<short-hash>_<slug>.md
  ```
- The plan must state: summary, evidence, root causes, design, TDD order, acceptance criteria, risks, and files expected to change.
- Use the existing plans as templates:
  - `docs/plan/implemented/20261018_040921_4c5c12fa_rgb-concept-bulb-off-cube-collapse-challenge-colors.md`
  - `docs/plan/implemented/20261018_050252_android-mobile-rendering-and-containerized-testing.md`
- When implemented and verified, move the plan to `docs/plan/implemented/`.
- Keep the plan current if the design changes during implementation.

---

## 6. Responsive architecture rules

### Desktop

- The desktop/landscape presentation keeps the existing **1280 × 720** Reveal canvas and visual design.
- Do not change desktop layout, typography, colours, spacing, or interactions as part of mobile work.
- At normal desktop sizes, screenshots must match the current design.

### Portrait phones and small tablets

- Portrait mode applies when `viewportWidth <= 900`, `viewportHeight > viewportWidth`, and the device is touch-capable. Do not switch a narrow desktop window into the phone layout.
- Portrait uses a **720 × 1280** virtual canvas with `data-layout="portrait"` on `<html>`.
- Set `data-touch="true"` from `navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches`.
- Scope portrait CSS with `html[data-layout="portrait"]`.
- Reflow rows into columns, enlarge text and controls, and keep every slide inside 720 × 1280.
- Enlarge the light-mixer circles and positions, swatches, and bulb for the larger portrait stage; do not leave desktop-sized geometry inside a 420 px portrait container.
- All functionality must remain: cups, switch, cube slider, challenge, presets, fragments.
- Do not use a rotate-only overlay as the mobile solution. The portrait layout itself must be usable.

### Landscape phones

- Keep the 1280 × 720 canvas.
- On coarse-pointer phone-sized screens, enlarge cup, switch, chip, and challenge controls where they fit.
- Do not alter desktop pointer layouts.

### Reveal.js

- Keep Reveal in slide mode on phones:
  ```js
  view: 'slide',
  scrollActivationWidth: 0,
  touch: true,
  ```
- Reveal 6 auto-enters scroll view at ≤ 435 px unless `scrollActivationWidth` is disabled. Scroll view hides controls and breaks horizontal swipe navigation.
- On orientation change, reconfigure Reveal with the new canvas size and call `Reveal.layout()`. Preserve the current slide.

### Android 2020 baseline

- Target **Android 10+ (API 29) / Chromium 84+ (2020)**.
- The manual smoke-test device is the operator's **Samsung A65**; record the exact model, Android version, and Chrome/WebView version when testing.
- Do not use `dvh`, `:has()`, container queries, `aspect-ratio`, or other features newer than Chromium 84.
- `matchMedia`, `PointerEvent`, `ResizeObserver`, flex `gap`, `min()/max()/clamp()`, and `touch-action` are allowed.
- Provide graceful fallbacks for optional visual features.

### Touch rules

- Use real touch events in tests; mouse events alone do not prove Android behaviour.
- Enable touch emulation explicitly via CDP (`Emulation.setTouchEmulationEnabled` and `Emulation.setDeviceMetricsOverride`); do not assume Selenium's `mobileEmulation` sets `maxTouchPoints`.
- `pointercancel` must not commit a value. Only `pointerup` may commit a tap.
- Cancel long-running animations (for example the intro-bulb `requestAnimationFrame` loop) when their slide is deactivated.
- Hide `.focus-hint-banner` on touch devices; tapping a cup currently shows a keyboard-only hint that can cover mobile UI.
- Use `touch-action` narrowly; do not disable scrolling for entire widgets unnecessarily.
- Add `overscroll-behavior: none` where pull-to-refresh could interrupt a gesture.
- Respect safe-area insets for fixed overlays.
- Keep interactive controls accessible: `aria-*`, keyboard support, visible focus, and touch targets.

---

## 7. Code and layout rules

- Edit only `app/` and the supporting scripts/tests/docs — never `web/` or `dist/`.
- Prefer pure helpers in `app/src/js/layout.js` or `app/src/js/util.js` and test them directly.
- Keep layout-only styles in CSS classes, not inline `style` attributes, so portrait overrides can work cleanly.
- Do not break the offline contract: no remote fonts, images, scripts, or styles in the built file.
- Preserve system light/dark theme behaviour and the intentionally dark additive-light stage.
- Keep child-facing copy simple, Russian, and pedagogically honest.
- Do not add runtime dependencies without a plan and approval.

---

## 8. Git and communication

- Do not commit generated files, dependency folders, screenshots, or container volumes.
- Commit messages should describe the user-visible behaviour. The repository uses messages such as:
  ```text
  feat: finish RGB visual fixes, cube collapse, expanded challenge and in-place retry [TDD]
  docs: plan responsive mobile layout and containerized testing
  ```
- In your final response, state:
  - what changed;
  - which tests/commands were run and their result;
  - any remaining risks or follow-ups.
- Be concise. Show exact file paths and exact commands.
- If a test cannot run in the container, say so explicitly and explain what is missing. Never silently run it on the host.

---

## 9. Quick start for a new agent

1. Read this file.
2. Read `README.md` (project overview and teacher deliverable).
3. Read the active plan in `docs/plan/` that matches the task.
4. Build/enter the container:
   ```bash
   ./containers/run.sh
   ```
5. Inside the container:
   ```bash
   npm ci
   npm test
   npm run package
   npm run verify:web
   ```
6. Write the failing test first.
7. Implement.
8. Run the full check suite:
   ```bash
   ./containers/run.sh bash containers/test.sh
   ```
9. Update the plan and README if needed.
