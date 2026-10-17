# Plan: Honest RGB light mixing, a truly dark bulb, a collapsing cube, and a bigger colour challenge

- **ID / filename:** `20261018_040921_4c5c12fa_rgb-concept-bulb-off-cube-collapse-challenge-colors.md`
- **Date:** 2026-10-18
- **Status:** Proposed
- **Depends on / cross-references:**
  - `docs/plan/implemented/20261018_030423_573e1977_deck-polish-system-theme-bulb-brightness-slides.md` — system light/dark theme, `bulbBrightness()`, and the current bulb SVG split (body vs emissive). This plan fixes visual states that plan left unfinished.
  - `docs/plan/implemented/20261018_030657_08d53c07_cube-myths-challenge-grownups.md` — current isometric cube, vertical myth stack, and challenge layout.
  - `docs/plan/implemented/20261018_023540_084f6a85_standalone-offline-single-file-presentation.md` — packaging contract (`npm run package` must stay self-contained).
  - `docs/plan/implemented/20261018_021427_9c087dca_rgb-cups-16-million-colors.md` — original pedagogy: additive RGB light, 256 steps per channel, 16 777 216 colours.
- **Owner:** (assign)
- **Language of deliverable UI:** **Russian** for every child-facing string; code, tests, comments, and this plan in English.
- **Scope:** five visual/UX defects and one content expansion. No new runtime dependencies.

---

## 1. One-paragraph summary

The deck currently looks wrong in the **light system theme**, and two interactions do not tell the story they promise:

1. **Slide 3 «Три чашки света»** and **myth 2 «Свет смешивается как краска?»** use `mix-blend-mode: screen` directly on the slide background. On a light backdrop, `screen` turns pure red/green/blue into pale pastels and near-white. The additive RGB lesson disappears.
2. **Slide 4 «0 и 255: выключатель света»** and **slide 5 «Цветовая лаборатория» → 🌙 Ночь** show a bulb that stays white when it is off. The emissive glass is faded to `opacity: 0`, but there is no unlit glass underneath; the transparent bulb reveals the white slide panel.
3. **Slide 8 «Три чашки: от квадрата к кубу»** keeps drawing the other blue sheets at reduced opacity even when the blue slider is at `0`. The cube never collapses to the single R×G square, so the main visual proof of «256 × 256» is missing.
4. **Slide 12 «Найди такой цвет»** has only five hard-coded targets. The children like the game and want more colours.

The fix is one shared **dark light-mixing stage** for both lightmix slides, an **unlit dark glass** layer inside the bulb, a **blue-sheet layer model** that grows/collapses with the blue value, and a **larger, testable target list** for the challenge. All logic that can be pure is extracted and tested first (TDD); the visual results are checked with a small headless contract script plus screenshots in both themes.

---

## 2. Feedback index and current evidence

The reviewer uses the **on-screen slide counter**, while `app/index.html` sections are 0-based. The current deck counts fragments, so the on-screen total is larger than the number of sections; always anchor to the heading, not only the number.

| Feedback | On-screen | File index (`app/index.html`) | Heading / component | Symptom |
|---|---|---|---|---|
| #1 | 3 | 2 | «🥛 Три чашки света» / `createLightMix` | circles are pale pink/green/blue, not honest RGB |
| #2 | 4 | 3 | «🔌 0 и 255: выключатель света» / `createBulb` | bulb looks white when switched off |
| #3 | 5 | 4 | «🔬 Цветовая лаборатория» / `createBulb` | 🌙 Ночь preset looks white, like the off bulb |
| #4 | 8 | 7 | «🧊 Три чашки: от квадрата к кубу» / `createCubeIllustration` | blue sheets do not disappear; cube never becomes a square |
| #5 | 10 (myth 2) | 8 / nested `8/1` | «Свет смешивается как краска?» / `createLightMix` | same washed-out circles as slide 3 |
| #6 | 12 | 9 | «🎯 Найди такой цвет» / `createChallenge` | only 5 targets; children want more colours |

### 2.1 Measured / observed root causes

**A. Light mixing on a light backdrop (items #1 and #5).**

`app/src/css/components.css`:

```css
.lightmix-circle {
  mix-blend-mode: screen;
}
.lightmix-circle.red   { background: #ff0000; }
.lightmix-circle.green { background: #00ff00; }
.lightmix-circle.blue  { background: #0000ff; }
```

The circles are mathematically pure RGB, but `screen` blends them with whatever is behind them. In the light theme the slide background is approximately `#f4f6fb` (`Cb ≈ 0.96`). The screen formula

```text
screen(Cb, Cs) = 1 - (1 - Cb) * (1 - Cs)
```

turns pure red `(1, 0, 0)` into approximately `(1, 0.96, 0.96)` — pale pink. Pure green and blue become pale mint and pale blue. At the centre all three overlap into near-white. On the dark theme it works much better, but the deck must be correct in **both** themes.

**B. A transparent “off” bulb (items #2 and #3).**

`app/src/js/bulb.js` draws the glass twice:

- `.bulb-emissive` contains the radial glow, the coloured glass fill, and the bright filament; its opacity is `bulbBrightness(r, g, b)`.
- `.bulb-body` contains only the outline and the socket/base.

At `(0,0,0)` the emissive group has `opacity: 0`. There is no unlit fill in `.bulb-body`, so the glass area is transparent and shows the white `.stage-group` panel behind it. The bulb reads as a white bulb, not an off bulb.

The same reason makes 🌙 Ночь `(0,0,0)` look white. A dim colour such as the challenge’s «Полночь» `(10,20,50)` has brightness `(50/255)^0.8 ≈ 0.28`; composited over a white panel at 28 % it also reads as a pale grey, not a dark blue.

**C. The cube always draws every sheet (item #4).**

`app/src/js/cube.js`:

```js
const sheets = sliceBlues(5); // [0, 64, 128, 191, 255]
sheets.forEach((b) => {
  if (b === blue) return;          // only skip the selected one
  paintSheet(quad(b / 255), b, b === 0 ? 0.9 : 0.35);
});
paintSheet(quad(blue / 255), blue, 1); // selected sheet on top
```

When `blue = 0`, the other four sheets (`64, 128, 191, 255`) are still painted at `alpha = 0.35`. The blue slider changes only the *highlight*, not the *number of sheets*. The child sees a ghost cube, not one square.

**D. The challenge has five fixed colours (item #6).**

`app/src/js/challenges.js` contains:

```js
const TARGETS = [
  { name: '☀️ Солнце', r: 255, g: 220, b: 0 },
  { name: '🌊 Океан', r: 0, g: 120, b: 255 },
  { name: '🌱 Трава', r: 40, g: 200, b: 60 },
  { name: '🍬 Жвачка', r: 255, g: 105, b: 180 },
  { name: '🌙 Полночь', r: 10, g: 20, b: 50 }
];
```

The game works, but after five solves it loops. There is nothing to try for children who liked the slide.

---

## 3. Design

### 3.1 Shared light-mixing stage (items #1 and #5)

Keep the physically correct additive model (`mix-blend-mode: screen`) but give it a **fixed dark backdrop in every theme**. Additive light is best demonstrated on black; this is also how the slide already reads in dark mode.

`app/src/js/lightmix.js` becomes:

```html
<div class="lightmix-container">
  <div class="lightmix-stage" role="img" aria-label="Красный, зелёный и синий свет складываются в белый">
    <div class="lightmix-circle red" data-lchan="r"></div>
    <div class="lightmix-circle green" data-lchan="g"></div>
    <div class="lightmix-circle blue" data-lchan="b"></div>
  </div>
</div>
```

`app/src/css/components.css`:

```css
.lightmix-container {
  width: 260px;
  height: 220px;
  margin: 0 auto;
}

.lightmix-stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 20px;
  border: 2px solid var(--light-stage-border);
  /* always dark: screen blending must happen on black */
  background: var(--light-stage-bg);
  isolation: isolate;           /* keep the blend inside the stage */
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.55);
}

.lightmix-circle {
  position: absolute;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  mix-blend-mode: screen;
  transition: opacity 0.1s;
}
```

Add tokens in `theme.css` (same in light and dark; intentionally a dark “light lab” panel):

```css
--light-stage-bg: #04060c;
--light-stage-border: rgba(255, 255, 255, 0.16);
```

The circles keep their pure `#ff0000`, `#00ff00`, `#0000ff` backgrounds. The store still drives `opacity` from the channel value. On the dark stage:

- red + green → yellow
- red + blue → magenta
- green + blue → cyan
- all three → white

This is the RGB concept the slide is supposed to teach.

**Myth 2** uses the same component, so it inherits the fix. Its current `.myth-panel` is only 190 px wide while the stage is 260 px. A `transform: scale()` does **not** change the layout width, so it can still overflow or push the paint panel. Prefer widening the light panel:

```css
.myth-panel--lightmix { width: 270px; }
```

and add that class to the first `.myth-panel` in `app/index.html`. If the slide becomes too wide, implement a real compact variant (a 200 × 170 stage with adjusted circle positions) instead of relying on scaling alone.

Do not use `mix-blend-mode: screen` on a light backdrop anywhere else.

### 3.2 A truly unlit bulb (items #2 and #3)

Keep the existing brightness model (`bulbBrightness` = strongest channel, no 0.2 floor). Add an **unlit glass layer** that is always visible underneath the emissive layer.

The goal is **not** “make the bulb black in every state”. The goal is to give the bulb three visually different states, so a child can tell them apart at a glance:

| State | Glass fill | Glow / halo | Filament | Reinforcing text |
|---|---|---|---|---|
| **off** `(0,0,0)` | neutral dark slate, no colour tint | **none** | dark grey, not glowing | readout `rgb(0, 0, 0)`; switch caption «свет выключен» |
| **dim** (e.g. `10,20,50`) | dark slate + a little coloured light | faint coloured halo | faint light | readout shows the colour; it is visibly darker than a full channel |
| **on** (e.g. `255,220,0`) | saturated colour, fully lit | strong coloured halo | bright white glowing filament | readout shows the colour; switch caption «ярче всего!» |

So the contrast is **neutral dark glass + no glow** (off) versus **coloured glowing glass** (on). A dim colour is not white either: it is a dark glass with a faint coloured glow. The RGB readout and the switch caption reinforce what the child sees, but they are not the only cue.

Optionally add a small visible state word to the readout box (`.bulb-state-label`, `aria-live="polite"`): «свет выключен» / «тусклый свет» / «яркий свет». Do this only if it does not crowd the slide; the visual contrast must work without it.

New SVG structure in `app/src/js/bulb.js`:

```html
<g class="bulb-unlit">
  <!-- dark glass fill: always visible, never white -->
  <path class="bulb-glass" d="..." fill="var(--bulb-off-fill)" />
  <!-- dark filament so the bulb is recognisable when off -->
  <path class="bulb-filament-off" d="..." stroke="var(--bulb-filament-off)" ... />
</g>

<g class="bulb-emissive">
  <!-- radial glow, coloured glass fill, bright filament -->
</g>

<g class="bulb-body">
  <!-- glass outline, socket, base: always visible, theme-aware -->
</g>
```

Order matters: unlit fill first, emissive on top, outline/socket on top of both.

Add tokens in `theme.css`:

```css
/* dark theme (default) */
--bulb-off-fill: #1f232b;      /* neutral slate, not blue: must not look like a dim blue lamp */
--bulb-filament-off: #5b6472;
--bulb-outline-off: #6b7280;   /* neutral outline for the off state */

/* light theme */
--bulb-off-fill: #3f4754;      /* deliberately dark and neutral: an off bulb must read dark */
--bulb-filament-off: #64748b;
--bulb-outline-off: #475569;
```

In the dark theme the usual `--bulb-outline` is white. If the off bulb keeps that white 4 px outline, it can still read as a pale/glowing bulb. Use `data-bulb-state` to switch the outline to the neutral off value:

```css
svg[data-bulb-state="off"] .bulb-body {
  --bulb-outline: var(--bulb-outline-off);
  opacity: 0.85;
}
```

The coloured glass in `.bulb-emissive` still uses `var(--bulb-color)` and fades with brightness. At `(0,0,0)` only the neutral dark unlit glass remains, with a dark filament and no halo. At a dim colour like `(10,20,50)` the same dark glass is tinted by a low-opacity blue and gets a faint blue halo; it reads as a dark blue glow, not a white lamp. At a full colour such as `(255,220,0)` the saturated yellow glass, bright filament, and halo cover the unlit glass almost completely.

Expose the state for CSS/tests:

```js
const brightness = bulbBrightness(r, g, b);
const state = brightness === 0 ? 'off' : brightness < 0.5 ? 'dim' : 'on';
svgRoot.dataset.bulbState = state;
emissive.style.opacity = brightness;
```

Add a tiny pure helper in `util.js` (test-first):

```js
export const bulbState = (r, g, b) => {
  const brightness = bulbBrightness(r, g, b);
  return brightness === 0 ? 'off' : brightness < 0.5 ? 'dim' : 'on';
};
```

Use it in `bulb.js` so the DOM state and the tests share one definition.

Do **not** reintroduce a minimum opacity. `(0,0,0)` must be genuinely off.

### 3.3 A cube that collapses to a square (item #4)

Replace the “always five sheets” model with a **layer model driven by the blue value**.

Concept: the current blue value is the **front sheet** (the R×G square). Older blue levels are stacked **behind** it, further up-right. As the blue value grows, more sheets appear behind the front sheet; at `0` only the front sheet exists.

Pure helper in `app/src/js/cube.js` (test-first):

```js
/**
 * Blue levels visible for the current blue value.
 * The current sheet is the front layer (depth 0); older levels are behind it.
 * depth is normalised 0..1 for the isometric offset.
 */
export function sheetLayers(currentBlue, maxSheets = 6) {
  const blue = clamp(currentBlue, 0, 255);
  if (blue === 0) return [{ blue: 0, depth: 0 }];

  const steps = Math.max(
    2,
    Math.min(maxSheets, Math.round((blue / 255) * (maxSheets - 1)) + 1)
  );
  return Array.from({ length: steps }, (_, i) => {
    const b = Math.round((i * blue) / (steps - 1));
    return { blue: b, depth: (blue - b) / 255 };
  });
}
```

Examples:

| `currentBlue` | layers (`blue`, depth) | visual |
|---|---|---|
| `0` | `(0, 0)` | exactly one sheet: the R×G square |
| `64` | `(0, 0.25)`, `(64, 0)` | two sheets, partial depth |
| `128` | `(0, 0.50)`, `(43, 0.33)`, `(85, 0.17)`, `(128, 0)` | a partial cube |
| `255` | `(0, 1)`, `(51, 0.8)`, `(102, 0.6)`, `(153, 0.4)`, `(204, 0.2)`, `(255, 0)` | full illustrative cube |

`createCubeIllustration` then:

1. Calls `sheetLayers(blue, 6)`.
2. Draws layers in array order (oldest/back first, current/front last).
3. Uses `layer.depth` instead of `b / 255` for the isometric offset.
4. Paints non-current layers at `alpha ≈ 0.55`; paints the current layer at `alpha = 1` and highlights its outline.
5. Sets `canvas.dataset.sheetCount = String(layers.length)` and `canvas.dataset.blue = String(blue)` for the visual contract check.
6. Updates the caption:
   - `blue === 0`: «Синий 0: один лист — квадрат 65 536 цветов»
   - `blue === 255`: «Синий 255: весь куб — 16 777 216 цветов»
   - otherwise: «Синий N: листов N + 1 (на рисунке показаны некоторые)»

The `sliceBlues()` helper may stay for backward compatibility and existing tests, but it is no longer the source of the cube rendering. Add tests for `sheetLayers()`.

Performance: at most 6 layer draws per input event. The existing `bitmapFor(blue)` cache is **unbounded**: dragging through all 256 values creates 256 canvases of 256 × 256 × 4 bytes ≈ **67 MB**. Replace it with a small LRU (max 24–32 entries) or quantise the bitmap blue level, while keeping the selected sheet's own colour exact. Also hide or mute the «Синий ↗» axis label when `blue === 0`, otherwise the label points at empty space and suggests a cube that is no longer there.

### 3.4 More colours in the challenge (item #6)

Grow `TARGETS` from 5 to at least 15 colours, interleaving the new ones with the old favourites. Keep «☀️ Солнце» first so returning children see a familiar start; after that, mix old and new.

Proposed list (all values are 0–255 integers):

| # | Name | R | G | B | Why |
|---|---|---|---|---|---|
| 1 | ☀️ Солнце | 255 | 220 | 0 | existing |
| 2 | 🍓 Клубника | 255 | 40 | 80 | bright red-pink |
| 3 | 🌊 Океан | 0 | 120 | 255 | existing |
| 4 | 🍋 Лимон | 255 | 255 | 80 | pale yellow, still far enough from Sun |
| 5 | 🍇 Виноград | 128 | 0 | 160 | purple, a new mixing idea |
| 6 | 🌱 Трава | 40 | 200 | 60 | existing |
| 7 | 🌸 Сакура | 255 | 170 | 200 | soft pink, tests low green/blue |
| 8 | 🍊 Апельсин | 255 | 140 | 0 | orange |
| 9 | 🍬 Жвачка | 255 | 105 | 180 | existing |
| 10 | ❄️ Лёд | 150 | 230 | 255 | pale cyan |
| 11 | 🔮 Фиолетовый | 160 | 60 | 255 | violet |
| 12 | 🌿 Мята | 80 | 255 | 170 | mint green |
| 13 | 🌙 Полночь | 10 | 20 | 50 | existing dark colour |
| 14 | 🌅 Закат | 255 | 127 | 80 | coral/sunset |
| 15 | ☁️ Небо | 120 | 180 | 255 | sky blue |
| 16 | 🐸 Лягушка | 100 | 200 | 20 | yellow-green, separated from Grass |

Rules:

- Every target must be reachable with the existing cups and tolerance (`24` per channel).
- The tolerance boxes must not overlap: for every pair of targets, at least one channel must differ by **more than `2 × tolerance` = 48**. A weaker “differs by more than 24” check is not enough — e.g. Sun `(255,220,0)` and Lemon `(255,255,0)` would both accept a guess around `(255,237,0)`. The proposed Lemon `(255,255,80)` and Frog `(100,200,20)` values are chosen to keep all tolerance boxes disjoint. Add a unit test for this.
- Keep the existing hint logic and confetti. Extract it into pure helpers so it can be tested:
  ```js
  export const isColorMatch = (current, target, tolerance = 24) => ...
  export const hintFor = (current, target, tolerance = 24) => ...
  ```
- Optional but recommended: shuffle the target order once per session with an injectable RNG, and test the shuffle helper with a deterministic RNG rather than relying on `Math.random`.
- Use emoji that are safe on older offline machines (ideally Unicode ≤ 9.0). `❄️`, `🔮`, `🌅` are safer than `🧊`, `🟣`, `🪸`; the last three were added in Unicode 12/14 and may render as tofu on older Windows/macOS emoji fonts.
- Fix the challenge flow race conditions while adding targets:
  - clicking «Проверить цвет!» twice must not count the same target twice;
  - clicking «Пропустить ➔» during the 2 s auto-next delay must not skip two targets;
  - track **unique solved target names** in a `Set`, not a raw click counter, so the display cannot show `17 из 16`;
  - when all targets are solved, show «Все 16 цветов найдены!» and either stop or reshuffle deliberately.
  - Keep a `locked` flag and a `pendingTimer`; clear the timer on skip/load and ignore Check while locked.
- Fix the misleading progress pill. Today it says «Решено цветов: 0 из 16 777 216», which implies the child must solve all 16 million. Change it to:
  - «Найдено: 0 из 16» (the number is `TARGETS.length`), and
  - keep a separate small line «Всего в RGB: 16 777 216» if desired.
- Set `mountEl.dataset.targetCount = String(TARGETS.length)` and `mountEl.dataset.solvedCount = String(solvedNames.size)` so the visual contract can assert the game data without hard-coding 16 in the script.
- The target swatch and current swatch keep their existing layout. No extra buttons are required; «Пропустить ➔» already cycles targets.

---

## 4. TDD implementation plan

### Phase 0 — Baseline

1. Run `npm test`; record the green baseline.
2. Run `npm run package`; confirm `web/index.html` is self-contained.
3. Capture screenshots in **light** and **dark** mode for slides `#/2`, `#/3`, `#/4`, `#/7`, `#/8/1`, `#/9` using `scripts/shot.mjs` (or equivalent). Keep them as before/after evidence.
4. Start the dev server (`npm run dev`) and a Firefox with `--remote-debugging-port 9222` for the contract script.

### Phase 1 — Light-mixing contract (items #1 and #5)

**Red:** add `scripts/check-visuals.mjs` (BiDi, same style as `scripts/check-centering.mjs`) with assertions for the lightmixes:

- `document.querySelector('.lightmix-stage')` exists on slide `#/2`.
- Its computed `backgroundColor` parses to a dark colour (each RGB channel < 60).
- `.lightmix-circle.red` computed `backgroundColor === 'rgb(255, 0, 0)'`; green and blue likewise.
- computed `mixBlendMode === 'screen'`.
- the same stage exists on myth `#/8/1`.

Run it; it must fail before implementation.

**Green:** add the stage markup, tokens, and CSS; widen `.myth-panel--lightmix` or implement the compact variant if needed.

**Refactor:** remove any accidental `mix-blend-mode` usage outside the stage; keep `isolation: isolate`.

### Phase 2 — Bulb off/dim state (items #2 and #3)

**Red — unit tests:** extend `tests/unit/util.test.js` with `bulbState`:

- `bulbState(0,0,0) === 'off'`
- `bulbState(255,255,255) === 'on'`
- `bulbState(255,0,0) === 'on'` (a full channel is bright)
- `bulbState(10,20,50) === 'dim'` (dark blue is not “on”)
- `bulbState(0,0,1)` is `'dim'`
- monotonicity: a brighter max channel never changes `on → dim → off`.

**Red — visual contract:** extend `scripts/check-visuals.mjs`:

- On slide `#/3`, click `.light-switch`; the bulb SVG has `data-bulb-state="off"`, `.bulb-emissive` computed `opacity === '0'`, and `.bulb-glass` computed `fill` is not white/transparent (parse it and require a dark value).
- Click again; `data-bulb-state` becomes `'on'` and `.bulb-emissive` opacity is `> 0.9`.
- On slide `#/4`, click `[data-preset="0,0,0"]` (🌙 Ночь); the bulb is `off`, not white.
- Optionally set a dim colour through the cups and assert `data-bulb-state="dim"` and a low but non-zero opacity.

**Green:** add the unlit glass/filament group, `--bulb-off-fill`, `--bulb-filament-off`, `data-bulb-state`, and use `bulbState()`.

**Refactor:** keep the SVG outline/socket on top; verify the intro breathing animation on slide 0 and the playground bulb still work.

### Phase 3 — Cube collapse (item #4)

**Red:** extend `tests/unit/cube.test.js` with `sheetLayers`:

- `sheetLayers(0)` returns exactly `[{ blue: 0, depth: 0 }]`.
- `sheetLayers(255, 6)` returns 6 layers; first `blue === 0` with `depth === 1`; last `blue === 255` with `depth === 0`.
- `sheetLayers(128, 6)` returns > 1 layers, all `blue <= 128`, last `blue === 128`, last `depth === 0`, and depths are strictly decreasing.
- `sheetLayers(1, 6)` returns two layers `[0, 1]` (a tiny but real stack).
- Every layer blue is an integer in `0..255`; `depth` in `0..1`.
- No layer is duplicated.
- `sheetLayers(255, 6).length <= 6`.

**Red — visual contract:** on slide `#/7`, set the blue range to `0`, dispatch `input`; assert `canvas.dataset.sheetCount === '1'` and `canvas.dataset.blue === '0'`. Set it to `255`; assert `sheetCount > 1`. This is the exact regression the reviewer reported.

**Green:** implement `sheetLayers`, use `layer.depth` in `quad()`, draw back-to-front, and set the data attributes.

**Refactor:** keep `sliceBlues` tests green; remove the old “skip selected sheet” loop.

### Phase 4 — Challenge expansion (item #6)

**Red:** add `tests/unit/challenges.test.js`:

- `TARGETS.length >= 15`.
- Every target has an emoji/name, and `r/g/b` are integers in `0..255`.
- All names are unique.
- Pairwise distinctness: for every pair, at least one channel differs by more than `2 * 24 = 48`, so their tolerance boxes cannot overlap. The naive “> 24 on one channel” check is insufficient.
- A guess at the midpoint of two targets must match at most one target.
- `mountEl.dataset.targetCount` is set and the progress text uses the same `TARGETS.length`; no hard-coded 16 in the component.
- `isColorMatch({r:255,g:220,b:0}, TARGETS[0]) === true`.
- A guess that differs by exactly `24` on one channel matches; `25` does not.
- `hintFor()` returns «Добавь красного» / «Убавь красный» / etc. for the relevant channel.
- If shuffle is implemented: `shuffleTargets` with an injected deterministic RNG returns the same length, no duplicates, and contains every index exactly once.

**Green:** expand `TARGETS`, extract `isColorMatch`/`hintFor`, wire them into the click handler, and update the progress pill to use `TARGETS.length`.

**Refactor:** verify the existing confetti, hint, skip, and auto-next behaviour still work; no cross-slide store writes.

### Phase 5 — Integration and packaging

- Add `"check:visuals": "node scripts/check-visuals.mjs"` to `package.json` (and document the required dev server + Firefox, like `check-centering.mjs`).
- Run `npm test`, `npm run check:visuals`, and `node scripts/check-centering.mjs http://localhost:3000`.
- Rebuild the teacher deliverable: `npm run package`; confirm the self-contained line and open `web/index.html` from `file://`.
- Capture final light/dark screenshots for the six affected slides.

### Task breakdown

| ID | Task | Files | Depends | Done when |
|---|---|---|---|---|
| **L1** | Add `lightmix-stage` markup and dark-stage tokens/CSS; inherit in myth 2 | `app/src/js/lightmix.js`, `app/src/css/components.css`, `app/src/css/theme.css` | — | Pure R/G/B circles on a dark card; overlaps are yellow/cyan/magenta/white in both themes |
| **L2** | Add visual contract for stage darkness + pure circle colours | `scripts/check-visuals.mjs`, `package.json` | L1 (red first) | Contract fails before L1, passes after |
| **B1** | Add `bulbState` helper + unit tests | `app/src/js/util.js`, `tests/unit/util.test.js` | — | Red/green tests for off/dim/on |
| **B2** | Add unlit glass/filament, off-fill tokens, `data-bulb-state` | `app/src/js/bulb.js`, `app/src/css/theme.css` | B1 | Off bulb is dark in both themes; Night preset is dark; dim colours are dark blue, not white |
| **B3** | Extend visual contract for switch off/on and Night preset | `scripts/check-visuals.mjs` | B2 | Contract catches the old white-off bulb |
| **C1** | Add `sheetLayers` helper + unit tests | `app/src/js/cube.js`, `tests/unit/cube.test.js` | — | `0 → 1 sheet`; `255 → 6 layers`; depths correct |
| **C2** | Render layers by depth, draw back-to-front, set data attributes, update caption | `app/src/js/cube.js` | C1 | Slider `0` shows a single R×G square; slider `255` shows the full cube |
| **C3** | Extend visual contract for `sheetCount` at blue 0/255 | `scripts/check-visuals.mjs` | C2 | Contract fails on the old ghost cube, passes after |
| **K1** | Expand `TARGETS` to 16, extract `isColorMatch`/`hintFor` + tests | `app/src/js/challenges.js`, `tests/unit/challenges.test.js` | — | All target tests green; game still playable |
| **K2** | Update progress copy to «из 16», keep skip/solve flow | `app/src/js/challenges.js` | K1 | No more “0 из 16 777 216” |
| **I1** | Full verification, centering, packaging, screenshots | repo | all | `npm test`, `check:visuals`, centering, `npm run package` all pass |

Suggested order: **L** (shared, quick), **B** (shared bulb), **C** (cube), **K** (content), then **I**.

---

## 5. Files expected to change

| File | Change |
|---|---|
| `app/src/js/lightmix.js` | Add `.lightmix-stage` wrapper; keep channel opacity subscription; add Russian `aria-label`. |
| `app/src/css/components.css` | Dark lightmix stage, `isolation: isolate`, myth panel width/compact variant; any bulb/challenge style adjustments. |
| `app/src/css/theme.css` | Tokens `--light-stage-bg`, `--light-stage-border`, `--bulb-off-fill`, `--bulb-filament-off` for both themes. |
| `app/src/js/util.js` | `bulbState(r,g,b)` (and keep `bulbBrightness`). |
| `app/src/js/bulb.js` | Unlit glass/filament group, data state, keep emissive brightness. |
| `app/src/js/cube.js` | `sheetLayers()`, depth-based drawing, data attributes, honest captions. |
| `app/src/js/challenges.js` | Expanded `TARGETS`, extracted match/hint helpers, progress count. |
| `app/index.html` | Only if copy/labels change; the components own most markup. |
| `tests/unit/util.test.js` | `bulbState` tests. |
| `tests/unit/cube.test.js` | `sheetLayers` tests; keep `sliceBlues`/`isoProjection` tests. |
| `tests/unit/challenges.test.js` | New target/helper tests. |
| `scripts/check-visuals.mjs` | New BiDi visual contract for stages, bulb states, cube sheet count, challenge count. |
| `package.json` | `check:visuals` script. |

No new dependencies. Do not edit `web/` or `dist/` by hand; rebuild them.

---

## 6. Acceptance criteria

1. **Slide 3 and myth 2:** the lightmixing area is a dark card in both themes. The circles are pure red/green/blue; overlaps produce yellow/cyan/magenta and the centre is white. No pastel washout in light mode.
2. **Slide 4:** with the switch off, the bulb glass is visibly dark; the emissive layer has opacity `0`; the readout is `rgb(0, 0, 0)`. With the switch on, the bulb is bright white. Both themes.
3. **Slide 5:** the 🌙 Ночь preset produces a dark/off bulb, not a white one. A dim non-zero colour (e.g. `10,20,50`) produces a dark blue glow, not white.
4. **Slide 8:** at blue `0` the canvas shows exactly one sheet — the R×G square — with a caption confirming 65 536 colours. Dragging the blue slider up grows the stack; at `255` the full cube is visible. No ghost sheets remain at `0`.
5. **Slide 12:** at least 16 distinct targets are available; the children can play through all of them; the progress line says «из 16» (or the actual target count), not «из 16 777 216»; skip/solve still work.
6. `npm test` is green, including new `bulbState`, `sheetLayers`, and challenge tests.
7. `npm run check:visuals` passes against a running dev server and Firefox BiDi.
8. `node scripts/check-centering.mjs` still passes on every slide/sub-slide.
9. `npm run package` succeeds; `web/index.html` stays self-contained and opens offline.
10. Every affected slide fits 1280×720 and 375×667 in light and dark themes; no console errors; all visible strings are Russian.

---

## 7. Manual test checklist

- [ ] Light theme: slide 3 shows a dark light-mixing card with vivid red/green/blue and white centre. Myth 2 shows the same.
- [ ] Dark theme: the same slide looks correct; the dark card blends with the slide but the circles are still vivid.
- [ ] Slide 4: toggle the switch off → the bulb is dark, readout `rgb(0, 0, 0)`; toggle on → bright white.
- [ ] Slide 5: click 🌙 Ночь → the bulb is dark, not white. Set cups to a dark blue (e.g. `10,20,50`) → dark blue glow.
- [ ] Slide 8: drag blue to `0` → one square only; drag to `128` → partial cube; drag to `255` → full cube. Read the caption aloud.
- [ ] Slide 12: play/skip through all 16 target colours; hints appear; confetti fires; progress counter increments and cycles.
- [ ] Keyboard: switch space/enter; cups arrows; challenge buttons reachable.
- [ ] 1280×720 and 375×667 screenshots in both themes; no clipped content.
- [ ] `npm test`, `npm run check:visuals`, `node scripts/check-centering.mjs`, `npm run package`.

---

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A fixed dark stage looks odd inside the light theme | It is a “light lab” card: rounded, bordered, with a soft inner shadow. Verify contrast and spacing; keep it identical to the dark-theme look so the lesson is consistent. |
| `mix-blend-mode` blends with the slide instead of the stage | `isolation: isolate` on `.lightmix-stage` creates the stacking context; verify computed background and screenshot. |
| Myth 2’s 260×220 stage overflows the 190 px panel | Widen `.myth-panel--lightmix` to ~270 px (transform scaling does not change layout width) or implement a real compact variant. |
| Unlit glass makes the “on” bulb less bright | The emissive glass/filament is drawn on top; dark glass only shows at low brightness. Check full red, blue, green, white, and dim blue. |
| Dark glass in light theme looks like a black blob | Use a dark slate fill plus the outline/socket; the bulb silhouette remains readable. Verify screenshot. |
| Cube layer count causes flicker or heavy redraw | Cap at 6 layers, replace the unbounded bitmap cache with a small LRU, redraw only on slider input. |
| Changing draw order hides the highlighted sheet | Draw the current layer last; caption and outline make selection clear. |
| Random target order makes tests flaky | Prefer a fixed interleaved order, or inject an RNG into `shuffleTargets` and test that. |
| New targets’ tolerance boxes overlap | Require > `2 × tolerance` (48) on at least one channel, not merely > 24; unit-test every pair and the midpoint case. |
| Double-click/check/skip races in the challenge | `locked` flag + `pendingTimer`; unique solved-name `Set`; clear timer on skip/load. |
| Off bulb still has a white outline in dark theme | Switch `.bulb-body` to `--bulb-outline-off` and slightly lower opacity when `data-bulb-state="off"`. |
| New text/markup changes slide height | The §2A `ResizeObserver` relayout re-centres; run the centering check and screenshots. |
| Packaged file regresses | No new dependencies; run `npm run package` + `verify:web`. |

---

### 8.1 Pre-implementation review findings incorporated into this revision

A review of the proposed solutions found these additional problems. They are now part of the plan:

1. **Hash/index references were off by one.** The cube is `#/7` (not `#/6`), and myth 2 is `#/8/1` (the myths parent is section 8). The screenshot list and cube contract now use the correct indices.
2. **The challenge distinctness rule was too weak.** Two targets whose colours differ by more than 24 can still have overlapping ±24 tolerance boxes. Example: Sun `(255,220,0)` and Lemon `(255,255,0)` both accept `(255,237,0)`. The rule is now “at least one channel differs by more than `2 × tolerance` = 48”, and the proposed Lemon `(255,255,80)` / Frog `(100,200,20)` values make all tolerance boxes disjoint.
3. **The cube bitmap cache is unbounded.** `bitmapFor(blue)` can create 256 canvases of 256 × 256 × 4 bytes ≈ 67 MB when a child drags the slider across its range. Use a bounded LRU (24–32 entries) or quantise the illustrative sheet colours.
4. **The off bulb can still look lit in the dark theme.** The normal dark-theme outline is white. Add `--bulb-outline-off` and switch the outline via `svg[data-bulb-state="off"] .bulb-body` so the off silhouette is neutral, not white.
5. **Myth 2 does not fit its panel.** The stage is 260 px wide; `.myth-panel` is 190 px. A transform scale does not change layout width. Widen `.myth-panel--lightmix` to ~270 px or build a real compact variant.
6. **The challenge flow has race conditions.** Double-clicking Check counts a target twice; Skip during the 2 s auto-next timeout can skip two targets; a raw counter can exceed the target count. Add a `locked` flag, `pendingTimer`, and a unique solved-name `Set`.
7. **Newer emoji may be missing offline.** `🧊`, `🟣`, `🪸` are Unicode 12/14 and may render as tofu on older systems. Replaced with `❄️`, `🔮`, `🌅`.
8. **The 🌙 Ночь semantics need a product decision.** `(0,0,0)` means “off”; the challenge’s «Полночь» `(10,20,50)` means a very dark blue. Decide whether the playground preset should be off or dark blue before implementation; both are now visually correct.
9. **The visual contract can be flaky.** The lightmix circles have a 0.1 s opacity transition, and the deck has slide transitions. Wait for transitions before reading computed styles; verify both themes with screenshots, because the BiDi contract runs in one theme.
10. **`challenges.js` imports `canvas-confetti`.** Importing it in Vitest currently works, but if the agent wants fully DOM-free tests, split `TARGETS`/`isColorMatch`/`hintFor` into a `challenge-data.js` module and import that from both the component and the tests.

---

## 9. Open questions

1. **Lightmix backdrop:** fixed dark card in both themes (recommended, physically correct) vs. a theme-dependent backdrop? The dark card is required for additive `screen`; a light card cannot show RGB correctly.
2. **Cube growth:** continuous “more blue → more sheets” (recommended) vs. only collapse at exactly `0`? Continuous growth teaches the cube concept better.
3. **Challenge order:** fixed interleaved list (simpler, deterministic) vs. shuffle per session (more replay value)? If shuffling, inject the RNG for tests.
4. **Challenge target count:** 16 proposed; more is possible, but keep the pairwise-distinctness test and the slide height in mind.
5. **Playground 🌙 Ночь:** keep `0,0,0` as “off” (current) or align it with the challenge’s `10,20,50` «Полночь»? Keep `0,0,0` unless product asks otherwise; the bulb-off fix covers both.

---

## 10. Ready-to-paste brief for the implementing agent

> **Goal:** fix five visual defects and expand the colour challenge in the RGB kids deck. Work test-first.
>
> 1. **Light mixing (slides 3 and myth 2):** `mix-blend-mode: screen` is blending with the light slide background, washing pure RGB into pastels. Wrap the circles in `.lightmix-stage` with a permanently dark background (`--light-stage-bg`), `isolation: isolate`, border/radius; keep pure `#ff0000/#00ff00/#0000ff` and channel opacity. Widen `.myth-panel--lightmix` to ~270 px (a transform scale does not change layout width) or build a real compact variant.
> 2. **Bulb off (slides 4 and 5):** the emissive group fades to `0`, but the glass has no unlit fill, so the white panel shows through. Add an always-visible `.bulb-unlit` glass fill (`--bulb-off-fill`, dark in both themes) and a dark unlit filament beneath `.bulb-emissive`. Keep the outline/socket on top. In the dark theme, switch the off outline to `--bulb-outline-off` so the white outline does not make the bulb look lit. Add `bulbState(r,g,b)` returning `off|dim|on` + unit tests; set `data-bulb-state` on the SVG. No minimum opacity.
> 3. **Cube collapse (slide 8):** replace the “draw all five sheets except the selected one” loop with `sheetLayers(currentBlue, maxSheets = 6)`. The current blue is the front sheet (`depth 0`); older blue levels are behind at `depth = (currentBlue - blue) / 255`. At `0` return exactly one layer; at `255` return 6 illustrative layers. Draw back-to-front; set `canvas.dataset.sheetCount`/`data-blue`; update the caption; hide/mute the blue axis label at `0`. Replace the unbounded per-blue bitmap cache with a bounded LRU (24–32 entries) or quantise the illustrative blue level. Add unit tests for `sheetLayers`.
> 4. **Challenge (slide 12):** expand `TARGETS` to at least 15–16 distinct colours (proposed list in §3.4), extract `isColorMatch`/`hintFor`, add unit tests (count, uniqueness, tolerance, and **tolerance boxes disjoint: > 2 × 24 = 48 on at least one channel**). Add a `locked` flag + `pendingTimer`, track unique solved names in a `Set`, and prevent double-check/skip races. Use safe emoji (`❄️`, `🔮`, `🌅`). Update the progress pill to «из 16», keep skip/confetti/auto-next.
> 5. **Verification:** add `scripts/check-visuals.mjs` (BiDi, like `check-centering.mjs`) asserting the dark lightmix stage, pure circle colours, bulb `off`/`on`/`dim`, cube `sheetCount` at blue 0/255, and challenge target count. Wait for CSS/slide transitions before reading computed styles. Run `npm test`, `npm run check:visuals`, `node scripts/check-centering.mjs`, `npm run package`, and light/dark screenshots at 1280×720 and 375×667.
>
> Do not add runtime dependencies. Keep all child-facing strings Russian. Do not hand-edit `web/` or `dist/`.

---

*End of plan.*
