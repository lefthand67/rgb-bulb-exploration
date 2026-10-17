# Plan: Deck polish — system theme, honest bulb brightness, and clearer «Одна чашка» / «Две чашки» slides

- **ID / filename:** `20261018_030423_573e1977_deck-polish-system-theme-bulb-brightness-slides.md`
- **Date:** 2026-10-18
- **Status:** Draft — items 3–6 of the running feedback list (item 2 lives in the sibling plan)
- **Depends on / cross-references:**
  - `docs/plan/20261018_025806_468c36d2_interactive-0-255-light-switch-slide.md` — the new on/off switch slide **and §2A**, the prerequisite vertical-centering fix. Item 4 and item 3 below both touch the bulb, which that plan also uses: coordinate on `app/src/js/bulb.js`.
  - `docs/plan/implemented/20261018_021427_9c087dca_rgb-cups-16-million-colors.md` — original pedagogy/copy rules.
  - `docs/plan/implemented/20261018_023540_084f6a85_standalone-offline-single-file-presentation.md` — build/packaging contract (do not break `npm run package`).
  - `docs/plan/20261018_030657_08d53c07_cube-myths-challenge-grownups.md` — sibling plan for feedback items 7–10 (cube slide, myths slide, challenge playability, grown-up slide in Russian). Item 7 builds on this plan's §6.
- **Owner:** (assign)
- **Language of deliverable UI:** **Russian** for every kid-facing string; code/comments/plans in English.
- **Scope:** four independent improvements bundled because they all polish the same live deck. They can be implemented in any order.

---

## 1. One-paragraph summary

Four pieces of feedback on the current deck:

3. **The theme must follow the OS** (`prefers-color-scheme`), not be hard-wired dark. Today the deck is dark-only; a child on a light-mode device sees a dark app that ignores the system setting.
4. **Dragging the cups makes the bulb lose brightness.** Measured: this is a **real defect**, not expected physics. `bulb.js` fades the whole SVG using *relative luminance*, whose green weight is 0.72, so pure red (`255,0,0`) renders at ~21 % opacity and pure blue at the 20 % floor. That contradicts the deck's own message «255 — ярче всего». Fix the brightness model and add a short on-slide caption.
5. **«…до ослепительного сияния» oversells the red strip** on the «Одна чашка» slide. A normal display cannot show "dazzling" red; fix the wording (and optionally add a decorative glow + end labels).
6. **«Две чашки: 256 × 256 = 65 536» doesn't explain anything.** The child sees a square and a multiplication but not *why* we multiply. Add labelled axes, a "one row = 256 greens for one red; 256 rows → multiply" explanation, corner colour examples, and a working per-cell preview (today the click handler writes to a store on a *different* slide, so nothing visible happens).

---

## 2. Context — current state of the code

| Concern | Where it lives today | Note |
|---|---|---|
| Dark-only theme | `app/src/css/theme.css` (`:root` hard-codes `#0b0e17`, `#151b2b`; dark vignette at line ~76) + `app/src/js/main.js` imports `reveal.js/theme/black.css` | No `prefers-color-scheme`, no `color-scheme` meta |
| Hard-coded dark surfaces | `app/src/css/components.css` — ~25 occurrences of `rgba(255,255,255,x)`, `#fff`, dark hex colours | Cups, chips, cards, challenge box, grid borders |
| Bulb opacity | `app/src/js/bulb.js` — `lum = luminance(r,g,b); svgRoot.style.opacity = Math.max(0.2, lum/255)` | Whole SVG faded, 0.2 floor |
| Red strip copy | `app/index.html`, slide «📏 Одна чашка: 256 шагов» — fragment «…от полной темноты до ослепительного сияния.» | Strip is `grid2d.js` → `createStrip1D` |
| Two-cups slide | `app/index.html`, slide «🖼️ Две чашки: 256 × 256 = 65 536» + `grid2d.js` → `createGrid2D` | No axis labels; `onSelect` writes `playgroundStore` (another slide) |

**Slide-number mapping (important):** the user's feedback uses the *on-screen* counter (`c/t`, 1-based), while `app/index.html` sections are 0-based.

| User says | On-screen counter | File section index | Heading |
|---|---|---|---|
| «слайд 4» | `4 / 10` | 3 | 🔬 Цветовая лаборатория (the cups) |
| «слайд 5» | `5 / 10` | 4 | 📏 Одна чашка: 256 шагов |
| «слайд 6» | `6 / 10` | 5 | 🖼️ Две чашки: 256 × 256 = 65 536 |

---

## 3. Item 3 — Theme must inherit from the system

### 3.1 Goal
The deck automatically switches between the existing **dark "light lab"** and a new **light** theme based on the OS/browser setting (`prefers-color-scheme`), with no visible regression in either mode. No manual toggle required (optional in §3.6).

### 3.2 Design
1. **Declare support** in `app/index.html`:
   ```html
   <meta name="color-scheme" content="dark light">
   ```
   and in CSS `:root { color-scheme: light dark; }` so scrollbars, focus rings, and form controls adapt.
2. **Stop importing reveal's dark theme.** In `app/src/js/main.js`, remove `import 'reveal.js/theme/black.css';` and set reveal's own `--r-*` variables from our theme instead (reveal 6 themes are pure CSS variables):
   ```css
   /* app/src/css/theme.css */
   :root {
     --r-background: var(--bg-color);
     --r-background-color: var(--bg-color);
     --r-main-color: var(--text-main);
     --r-heading-color: var(--text-main);
     --r-heading-text-transform: none;
     --r-link-color: var(--blue);
     --r-link-color-hover: #7aa8ff;
     --r-main-font: 'Nunito', sans-serif;
     --r-heading-font: 'Comfortaa', cursive, sans-serif;
     --r-main-font-size: 30px;
   }
   ```
   Keeping `black.css` and overriding half of it is possible but fragile; dropping it is cleaner.
3. **Semantic tokens** in `theme.css` for dark (default) and light:
   ```css
   :root {
     --bg-color: #0b0e17;
     --bg-vignette: radial-gradient(circle at 50% 30%, #1a2238 0%, #0b0e17 75%);
     --panel-bg: #151b2b;
     --panel-border: rgba(255,255,255,0.12);
     --panel-shadow: 0 10px 30px rgba(0,0,0,0.5);
     --surface: rgba(255,255,255,0.08);
     --surface-hover: rgba(255,255,255,0.18);
     --track-bg: rgba(255,255,255,0.05);
     --track-border: rgba(255,255,255,0.3);
     --text-main: #f5f7ff;
     --text-muted: #a0aec0;
     --accent: #ffe8a3;
     --bulb-outline: #ffffff;
     --bulb-body: #718096;
   }
   @media (prefers-color-scheme: light) {
     :root {
       --bg-color: #f4f6fb;
       --bg-vignette: radial-gradient(circle at 50% 30%, #ffffff 0%, #eef1f8 75%);
       --panel-bg: #ffffff;
       --panel-border: rgba(15,23,42,0.12);
       --panel-shadow: 0 10px 30px rgba(15,23,42,0.12);
       --surface: rgba(15,23,42,0.05);
       --surface-hover: rgba(15,23,42,0.12);
       --track-bg: rgba(15,23,42,0.06);
       --track-border: rgba(15,23,42,0.30);
       --text-main: #101828;
       --text-muted: #475467;
       --accent: #b7791f;          /* readable accent on light */
       --bulb-outline: #344054;
       --bulb-body: #98a2b3;
     }
   }
   ```
   The vignette rule becomes `background: var(--bg-vignette);`.
4. **Refactor `components.css` to tokens.** Replace hard-coded `rgba(255,255,255,x)` / `#fff` / dark hex with the tokens above. Full list to touch:
   - `.cup-container` (bg, border, shadow), `.cup-handle`, `.cup-ticks`, `.cup-value-pill`, `.cup-btn` (+ hover)
   - `.stage-group` (border/shadow), `.readout-hex`
   - `.preset-chip` (+ hover), `.pixel-strip` / `.pixel-grid` borders, `.cube-slice`
   - `.myth-card`, `.challenge-box`, `.swatch-target` / `.swatch-current` border
   - `.focus-hint-banner` (verify contrast in light mode)
   - `.btn-primary` stays red with white text (contrast is fine in both).
5. **Bulb adapts too.** `bulb.js` hard-codes `stroke="#ffffff"` for the glass/filament and grey hex for the socket. Replace with `var(--bulb-outline)` / `var(--bulb-body)` so the "off" bulb is visible on a light background. *(This overlaps item 4 — see §4.4 — implement together to avoid touching `bulb.js` twice.)*
6. **(Optional, not required)** a manual `Светлая / Тёмная / Как в системе` switch persisted in `localStorage`, overriding the media query via `data-theme` on `<html>`. Only if the parent wants it; the stated requirement is system inheritance.
7. **Verification:** headless screenshots at 1280×800 with `prefers-color-scheme: light` and `dark` for slides 0, 3, 5, 8 (Firefox can force it: `layout.css.prefers-color-scheme.content-override` via a profile, or test on a light-mode OS). Check contrast: body text ≥ 4.5:1, large headings ≥ 3:1. The coloured strips/grids/circles must still read correctly on light.

### 3.3 Non-goals
- No user-facing theme picker unless requested (optional §3.6).
- No per-slide light/dark overrides.
- Don't change slide content/order here.

---

## 4. Item 4 — «Ползунки двигаю, лампа теряет яркость — это нормально?»

### 4.1 Answer
**No — it is a bug.** It contradicts the deck's own promise «255 — ярче всего», and it makes a full red or blue cup look almost dark.

### 4.2 Evidence (measured from the source)
`app/src/js/bulb.js`:
```js
const lum = luminance(r, g, b);            // 0.2126·R + 0.7152·G + 0.0722·B
const brightnessFactor = Math.max(0.2, lum / 255);
svgRoot.style.opacity = brightnessFactor;  // fades the *entire* SVG
```
| Cup values | `luminance` | resulting SVG opacity | looks like |
|---|---|---|---|
| `0,0,0` | 0 | 0.20 (floor) | dim, never truly off |
| `255,0,0` full red | 54.2 | **0.21** | almost invisible red |
| `0,0,255` full blue | 18.4 | **0.20** | almost invisible blue |
| `0,255,0` full green | 182.4 | 0.72 | fairly bright |
| `255,255,255` white | 255 | 1.00 | bright |

The green-heavy weights were chosen for *text readability*, not for an emissive light source. Dragging a cup away from white therefore visibly dims the lamp. The `0.2` floor also means the bulb never goes fully dark, which would undermine the new on/off switch slide (§ sibling plan).

### 4.3 Required fix — brightness from the strongest channel, fade only the emissive parts
1. In `app/src/js/util.js`, add a tested pure helper:
   ```js
   // Perceptual output of an RGB light: the brightest channel drives how
   // much light the bulb emits. 0 = off, 1 = at least one channel at max.
   export const bulbBrightness = (r, g, b) =>
     Math.pow(Math.max(clamp(r,0,255), clamp(g,0,255), clamp(b,0,255)) / 255, 0.8);
   ```
   (`luminance()` stays for contrast calculations; it is simply the wrong tool for emission.)
2. In `app/src/js/bulb.js`:
   - compute `const brightness = bulbBrightness(r, g, b);`
   - split the SVG into `<g class="bulb-body">` (socket, base, glass outline — **always visible**, theme-aware `--bulb-outline` / `--bulb-body`) and `<g class="bulb-emissive">` (the radial glow + filled glass + filament glow);
   - set opacity on `.bulb-emissive` only, `0` when off and `1` at any full channel;
   - scale the glow (`filter: drop-shadow(0 0 Npx …)`) with `brightness`;
   - keep the `rgb()`/`#hex` readout unchanged.
3. Remove the `0.2` floor; `(0,0,0)` must look genuinely off.
4. Add a short **on-slide caption** (user explicitly asked for a comment) near the bulb on the interactive slides:
   > «Чем больше света в чашках, тем ярче светит лампочка.»
   and, on the switch slide, «0 — совсем не светит.» This documents the intended behaviour; the bug itself is gone.
5. Unit tests in `tests/unit/`:
   `bulbBrightness(0,0,0) === 0`, `bulbBrightness(255,0,0) === 1`, `bulbBrightness(0,0,255) === 1`, `bulbBrightness(0,255,0) === 1`, monotonic in each channel.

### 4.4 Coordinate with the switch plan
The switch slide's whole point is «0 = off / 255 = bright». Item 4's SVG split and theme-aware outline are what make that slide look right in both themes. Implement §3.2(5) and §4 together in one `bulb.js` edit.

---

## 5. Item 5 — «…до ослепительного сияния» on «Одна чашка: 256 шагов»

### 5.1 Analysis
The slide renders `createStrip1D` (`app/src/js/grid2d.js`): a `256 × 1` canvas filled with `rgb(x, 0, 0)` for `x = 0…255`, scaled to 48 px tall. The right end is the *most saturated red a standard sRGB display can show* — vivid, but neither "dazzling" nor a "сияние": there is no glow and no luminance ramp beyond saturation. The copy over-promises.

### 5.2 Fix (choose both, cheaply)
1. **Fix the wording** (primary, honest):
   > ~~«…от полной темноты до ослепительного сияния.»~~
   > **«Одна чашка даёт 256 разных оттенков красного — от полной темноты до самого яркого красного.»**
2. **Add end labels** under the strip: `0` at the left, `255` at the right, plus the existing pill «256 шагов (0 тоже шаг!)».
3. **(Optional decorative "сияние")** a soft red glow behind the right end (CSS `box-shadow`/radial overlay on the last ~10 % of the strip) so it *reads* as "bright" — clearly decorative, must not imply more than 256 steps. Guard with `prefers-reduced-motion` if animated.
4. Keep the strip's 256 discrete steps accurate; do **not** blend toward white (that would show colours outside the cup's range).

### 5.3 Acceptance
- No slide claims something the display cannot show.
- The strip visually communicates "dark → bright red" with `0`/`255` anchors.

---

## 6. Item 6 — Redesign «Две чашки: 256 × 256 = 65 536»

### 6.1 Why the current slide fails
Current markup:
```html
<h2>🖼️ Две чашки: 256 × 256 = 65 536</h2>
<p>Берём две чашки — красный и зелёный свет.</p>
<div id="grid-slide5"></div>
<p class="fragment">Получается целое поле из 65 536 цветов! Но это ещё не 16 миллионов…</p>
```
- The grid (`createGrid2D`) has **no axis labels**, so the child cannot tell that X = red, Y = green.
- Nothing shows **why we multiply**: no "for each red level there are 256 green levels".
- The click handler calls `onSelect → playgroundStore.setRGB(...)`, which updates the **Playground on a different slide** — on this slide, clicking does nothing visible.
- Colour meaning is absent: which corner is black / red / green / yellow?

### 6.2 Redesign (the "why multiply" story)
1. **Lead-in copy that states the question, not the answer:**
   > «Красный и зелёный можно смешать по-разному. Сколько разных цветов получится?»
2. **Label the axes** (HTML labels around the canvas, not baked into the bitmap):
   - below: «Красный →» with `0` … `255` at the ends;
   - at the left (rotated): «Зелёный ↑» with `0` … `255`.
3. **Corner legend** — four mini-swatches with captions so the square has meaning:
   `(0,0)` чёрный · `(255,0)` красный · `(0,255)` зелёный · `(255,255)` жёлтый.
4. **The multiplication, made visual:** highlight one **row** and one **column** (CSS outline over the canvas, or a second canvas overlay):
   - «Одна полоска — это один красный и все 256 зелёных.»
   - «Полосок тоже 256 — по одной на каждый красный.»
   - «Значит: **256 × 256 = 65 536** полосок-клеток.»
   The equation is already in the title; this makes it *mean* something.
5. **Working per-cell preview** — fix the dead interaction:
   - `createGrid2D` should render a **local** preview: on hover/tap of a cell update a swatch + text «красный 128 · зелёный 64» and the mixed colour, plus optionally a small bulb (`createBulb` with a local store) right on this slide.
   - Either change `createGrid2D`'s API to `onCell(r,g,b)` and wire it locally in `main.js`, or keep `onSelect` but pass a local store. **Do not** write to `playgroundStore` from another slide.
   - Keep it cheap: one `mousemove`/`click` handler on a single canvas, clamp to 0–255 (already done).
6. **Connect the story** to neighbours: previous slide = one cup → 256; this slide = two cups → 65 536; next slide = add blue → the cube → 16 777 216. Update the speaker notes accordingly.
7. **(Optional) row-sweep animation** that walks 256 rows once to "count" them (reduced-motion aware). Keep it optional; the labels + row/column highlight carry the lesson.

### 6.3 Files
- `app/index.html` — slide heading/lead/explanation fragments, axis/legend markup, local preview mount, notes.
- `app/src/js/grid2d.js` — `createGrid2D` gains labels hooks + `onCell` callback (backwards-compatible), and the row/column highlight.
- `app/src/js/main.js` — wire the slide-local preview store/bulb instead of `playgroundStore`.
- `app/src/css/components.css` — `.grid2d-container` grid layout for axes/legend, highlight styles, light-theme tokens.

### 6.4 Acceptance
- A child can answer «почему 256 × 256?» after this slide.
- Hovering/tapping a cell shows its red/green values and the resulting colour **on the same slide**.
- The four corners are labelled and match their colours.
- The slide still fits 1280×720 and works in both themes and on touch.

---

## 7. Task breakdown

| ID | Task | Files | Depends | Done when |
|----|------|-------|---------|-----------|
| **P3.1** | Add `color-scheme` meta + `color-scheme: light dark`; drop `black.css`; define `--r-*` from our tokens | `app/index.html`, `app/src/js/main.js`, `app/src/css/theme.css` | — | Deck renders correctly with reveal's theme removed, in dark |
| **P3.2** | Add semantic tokens + `prefers-color-scheme: light` palette + light vignette | `app/src/css/theme.css` | P3.1 | Toggling OS theme changes the whole page instantly |
| **P3.3** | Refactor `components.css` hard-coded colours to tokens | `app/src/css/components.css` | P3.2 | No `rgba(255,255,255,` remains except within token definitions; both themes pass contrast |
| **P3.4** | Theme-aware bulb outline/base (`--bulb-outline`, `--bulb-body`) | `app/src/js/bulb.js` | do with P4.2 | Off bulb is visible on light and dark |
| **P4.1** | `bulbBrightness()` helper + unit tests | `app/src/js/util.js`, `tests/unit/util.test.js` | — | Edge cases green |
| **P4.2** | Split bulb SVG into body/emissive; brightness from max channel; remove 0.2 floor; glow scaling | `app/src/js/bulb.js` | P4.1 | Pure red/blue/green bulbs are fully bright; black is fully off |
| **P4.3** | On-slide caption «Чем больше света…» | `app/index.html` | P4.2 | Text present on Playground / switch |
| **P5.1** | Reword «ослепительное сияние»; add `0`/`255` end labels | `app/index.html`, `app/src/js/grid2d.js`, `app/src/css/components.css` | — | Copy matches what is shown |
| **P5.2** | (Optional) decorative glow at the bright end | `app/src/css/components.css` | P5.1 | Reduced-motion safe |
| **P6.1** | Redesign slide markup: question lead, axes, corner legend, why-multiply fragments | `app/index.html` | — | Labels visible, copies reviewed |
| **P6.2** | `createGrid2D` API: `onCell`, axis/legend hooks, row/column highlight | `app/src/js/grid2d.js` | P6.1 | Hover/tap reports `(r,g)` |
| **P6.3** | Local preview (swatch + text + optional bulb) wired on the slide | `app/src/js/main.js`, `app/src/css/components.css` | P6.2 | Clicking a cell visibly changes the preview, no cross-slide store |
| **P7.1** | Verification sweep (both themes, both slide-5/6 changes, packaged build) | — | all | §9 passes |

Order suggestion: **P4 first** (small, high-impact, shared with the switch plan), then **P3**, then **P5**, then **P6**. Rebuild `web/index.html` (`npm run package`) at the end.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Removing `black.css` leaves reveal components unstyled | Define all `--r-*` variables we rely on in `theme.css`; screenshot every slide in dark to diff against the current look. |
| Light theme has poor contrast on coloured panels | Use the token table in §3.2; verify text ≥ 4.5:1 and large headings ≥ 3:1; the accent colour is darkened in light mode. |
| Refactoring `components.css` touches almost every widget | Mechanical find/replace to tokens; one writer; verify with dark screenshots (must be pixel-similar) + light screenshots. |
| Bulb SVG split breaks the intro breathing animation / other slides | `bulb.js` keeps the same public API; only internals change. Run slides 0, 1, 3, 8 and the new switch slide. |
| Item 6 makes the slide too busy / too tall | Fixed budget: one grid (~320 px), axes, four corner chips, two fragments; verify at 1280×720 and 375×667; drop the optional sweep first. |
| Item 6 interaction conflicts with item 2's layout fix | The grid canvas has fixed size; the local preview changes height slightly → the `ResizeObserver` relayout from the sibling plan §2A keeps centering correct. |
| Offline/package regression | No new runtime dependencies; re-run `npm run package` + `npm test`. |

---

## 9. Acceptance criteria

1. With the OS in light mode, the whole deck is light; in dark mode it is dark; switching the OS theme updates the page live. No hard-coded dark surface remains outside the token definitions.
2. `(255,0,0)`, `(0,255,0)` and `(0,0,255)` all render the bulb at full brightness; `(0,0,0)` is fully off; the bulb base/outline is visible in both themes.
3. A short caption on the interactive slides explains that more light in the cups = a brighter bulb.
4. The «Одна чашка» slide no longer promises «ослепительное сияние»; the strip shows labelled `0` and `255` ends (and an optional decorative glow).
5. The «Две чашки» slide explains *why* `256 × 256`: labelled axes, a "one row = 256 greens / 256 rows" explanation, four labelled corner colours, and a working per-cell preview **on the same slide**.
6. `npm test` is green (new `bulbBrightness` tests); `npm run package` succeeds and `web/index.html` stays self-contained.
7. Every slide still fits 1280×720 and 375×667 with no clipped content, in both themes.
8. All visible strings remain natural Russian; no English leaks.

---

## 10. Manual test checklist

- [ ] Switch OS to light mode, reload `web/index.html`: light theme, readable text, visible cups/cards/bulb, console clean. Switch back: dark theme.
- [ ] Playground: set the three cups to full red only → bulb is bright red (not dim). Full blue → bright blue. All zero → bulb visibly off, base still visible.
- [ ] «Одна чашка»: read the new sentence aloud; `0`/`255` labels align with the strip ends.
- [ ] «Две чашки»: the four corners are labelled and match; hovering a cell updates the preview with its red/green numbers; tapping works on touch; clicking does **not** alter another slide's state.
- [ ] Explain out loud why the answer is `256 × 256` using only what is on the slide.
- [ ] Headless screenshots: light+dark × slides 0,3,4,5,8 at 1280×800.
- [ ] `npm test` green; `npm run package` prints the self-contained line; open from `file://` offline.

---

## 11. Open questions

1. **Theme toggle:** system-only (recommended, per the request), or also a manual `Авто / Светлая / Тёмная` control persisted in `localStorage`?
2. **Light palette:** neutral white (`#f4f6fb`) or a softer warm paper tone? (Default: neutral.)
3. **Item 5:** wording-only fix (recommended) or also the decorative glow at the bright end?
4. **Item 6 preview:** swatch + numbers only, or also a small live bulb on the slide? (Default: swatch + numbers; bulb optional to save space.)
5. **Item 6 row/column highlight:** static callout frames, or the optional animated row-sweep? (Default: static; animation behind `prefers-reduced-motion`.)
6. **Bulb brightness gamma:** plain `max/255`, or the mild `^(0.8)` suggested in §4.3? (Default: `^0.8`, tune by eye.)

---

## 12. Appendix — ready-to-paste brief for the implementing agent

> **Objective:** four polish items on the live deck. Keep the existing look in dark mode; add a light mode that follows the OS; make the bulb brightness honest; make the «Одна чашка» wording accurate; rebuild the «Две чашки» slide so the multiplication is explained and interactive. Coordinate the `bulb.js` edits with the sibling switch plan.
>
> 1. **Theme (item 3):** add `<meta name="color-scheme" content="dark light">`, `color-scheme: light dark`, drop `reveal.js/theme/black.css`, define `--r-*` and semantic tokens for dark + `@media (prefers-color-scheme: light)`, refactor `components.css` to tokens, make the bulb outline theme-aware.
> 2. **Bulb (item 4):** add `bulbBrightness(r,g,b) = pow(max(r,g,b)/255, 0.8)` in `util.js` (+tests); split the bulb SVG into always-visible body and brightness-scaled emissive group; remove the `Math.max(0.2, …)` floor; add the caption «Чем больше света в чашках, тем ярче светит лампочка.»
> 3. **Wording (item 5):** replace «до ослепительного сияния» with «до самого яркого красного», add `0`/`255` labels at the strip ends.
> 4. **Two cups (item 6):** rewrite the slide with a question lead, labelled axes (`Красный →`, `Зелёный ↑`), four labelled corner colours, and an explanation «в каждой полосе 256 зелёных, полос 256 → 256 × 256»; extend `createGrid2D` with an `onCell` callback and wire a **slide-local** swatch/number preview (never the Playground store).
> 5. Verify both themes, both changed slides, `npm test`, and `npm run package`; re-run the §2A centering check from the sibling plan.

---

*End of plan.*
