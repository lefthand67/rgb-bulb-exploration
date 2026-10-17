# Plan: RGB "Cups" — an interactive reveal.js page explaining 16 million colors to 9-year-olds

- **ID / filename:** `20261018_021427_9c087dca_rgb-cups-16-million-colors.md`
- **Date:** 2026-10-18
- **Status:** Ready for implementation
- **Owner:** (assign)
- **Language of deliverable UI:** **Russian (`ru`)** — every kid- and parent-facing string. English only in code, comments, and the grown-up slide. See §14.
- **Target audience:** Russian-speaking kids ~9 years old, co-viewing with a parent

---

## 1. One-paragraph summary

Build an offline-capable **reveal.js** slide deck that explains *why an RGB light bulb has ~16 million colors* using a concrete physical metaphor: **three glasses ("cups") of colored light** — Red, Green, Blue — each with **256 fill levels (0–255)**. The child drags/taps/presses arrows to change how full each cup is; a big **SVG bulb reacts live** to the mixture. The deck then progressively reveals the math visually: `256` (one cup) → `256 × 256 = 65,536` (two cups) → `256 × 256 × 256 = 16,777,216` (three cups), plus myth-busting slides (e.g. `255,255,255` is *not* 255 million colors, it's full-brightness white) and a "make this color" challenge game. The deck must work with no internet connection after build, be responsive (laptop + tablet), keyboard- and touch-friendly, and never confuse a 9-year-old.

---

## 2. Context

- Repo `rgb-bulb` is currently an **empty git repository** (no commits, no files).
- The child owns an RGB smart bulb whose app advertises "16 million colors" and shows values such as `255,255,255`.
- The parent wants a *visual, hands-on* explanation, not combinatorics notation.
- **The children speak only Russian.** All visible copy must be natural Russian for a 9-year-old (not machine translation), and the page declares `<html lang="ru">`.
- Deliverable is a **plan document** (this file) to be implemented by one or more coding agents.

### 2.1 The real-world hook (use verbatim in slide copy, Russian)
> «Если смотреть на новый цвет каждую секунду, днём и ночью без сна, понадобится примерно **194 дня**.»

`16 777 216 с ÷ 86 400 с/сутки ≈ 194,2 суток`.

---

## 3. Goals & non-goals

### 3.1 Goals
1. A 9-year-old can explain, after the deck: *«В каждой чашке 256 шагов, а если перемножить три чашки — получится 256 × 256 × 256 = 16 777 216».*
2. The color of the bulb visibly changes the instant the cups change (≤1 frame of perceived lag).
3. The deck shows the *multiplication* as a picture (256 shades → 256×256 grid → 256×256×256 cube), not as a formula only.
4. Correct two common misconceptions (§4).
5. Deck is fun: dark "light lab" theme, glow, a challenge game, a counting animation.

### 3.2 Non-goals (out of scope for v1)
- No backend, no accounts, no real bulb pairing / Bluetooth / Wi-Fi control.
- No WebGL/Three.js requirement (a CSS/canvas cube illustration is enough).
- No attempt to teach binary/8-bit encoding to the child (optional grown-up slide only).
- No full localization framework; a simple RU string dictionary (EN kept only as a developer fallback).
- No analytics, no tracking, no external network calls at runtime.

---

## 4. Pedagogical design (the important part)

### 4.1 Core mental model — "cups of light"
- Three **transparent glasses**, one per channel: **R** (red), **G** (green), **B** (blue).
- Each glass can be filled from 0 (empty = that light is **off**) to 255 (full = that light at **brightest**).
- The bulb shows the *sum of the light* from all three glasses (additive mixing).
- We **do not** say "one drop = one row". Say **"step"** or **"amount of light"**. The cup is a *slider*, not a liquid that physically pours into the bulb.

### 4.2 The 255 vs 256 subtlety — MUST be handled explicitly
- The child will say "255". The truth: values run `0, 1, 2, …, 255` → that is **256 different numbers**, because **0 counts** (0 = off).
- Copy that resolves it kindly (Russian):
  > **0 — это «света нет». 255 — это «света больше всего». Если считать и 0, в каждой чашке 256 шагов.**
- In the UI show the range as `0…255` **and** a small pill: **«256 шагов (0 тоже шаг!)»**.
- Keep the formula consistent: `256 × 256 × 256`, with `0…255` shown as the values being multiplied.

### 4.3 Misconceptions the deck must actively bust
| # | Misconception | Russian copy shown on slide |
|---|---|---|
| M1 | «`255,255,255` — это 255 миллионов цветов». | «Это *настройка* самого яркого белого: все три чашки полны. А число цветов — `256 × 256 × 256`.» |
| M2 | «16 миллионов — это реклама». | «`256 × 256 = 65 536`; `65 536 × 256 = 16 777 216`. Смотри, как идёт умножение.» |
| M3 | «Свет смешивается как краска». | «Краска вычитает цвет (темнеет, коричневеет). Свет складывается (ярче, до белого).» + круги света с `mix-blend-mode: screen`. |
| M4 | «От 0 до 255 — это 255 шагов». | «256 шагов, потому что 0 — тоже шаг. (см. §4.2)» |

### 4.4 "WHY is there *more* than 16 million?" — the answer to the user's question
Two layers, taught in this order:
1. **Это 16,7 миллиона.** `256³ = 16 777 216`, а это уже **больше 16 000 000**. «16 миллионов» — просто округлённое доброе имя.
2. **Multiplication explodes fast.** One cup = 256. Two cups = 65,536 (256× more). Three cups = 16.7 million (another 256× more). Show it as growth, with an animated counter.

> Optional "bonus" note (grown-up slide, Russian): «В некоторых современных лампочках есть ещё **белый канал (W)** или ручка **тёплого/холодного света** — тогда статичных цветов становится ещё больше 16,7 миллиона». Keep this off the kid slides to avoid overload.

### 4.5 Правила текста (для тех, кто пишет копирайт)
- **Весь видимый текст — только по-русски**, и звучит естественно, как взрослый говорит ребёнку. Никакого машинного перевода и транслитерации.
- Короткие предложения: ≤ 10–12 слов. Одна мысль — одно предложение.
- Настоящее время, дружелюбно, без сюсюканья. Обращение на «ты»: «смотри», «давай», «получилось!».
- Тысячи разделяем пробелом (лучше узким неразрывным): `16 777 216`. Дробную часть — **запятой**: `16,7 миллиона`. В коде — `16_777_216` / `16.7`, это на UI не влияет.
- Согласуем слова после чисел: `256 шагов`, `65 536 цветов`, `16 777 216 цветов`, `194 дня`, `1 цвет`, `2 цвета`, `5 цветов`.
- Каждое новое число получает визуальную опору (чашка, сетка, счётчик).
- Термины — только на слайде для взрослых и с простым объяснением: «канал», «hex», «бит».
- Проверка: пусть ребёнок прочитает вслух — если спотыкается, текст переписать.

---

## 5. Slide-by-slide specification

> Reveal.js fragments (`class="fragment"`) are used for progressive reveal. Vertical stacks may be used for the myth-buster cards. Speaker notes go in `<aside class="notes">` for the parent.

### Slide 0 — Title
- **Title:** 🌈 «16 миллионов цветов?! Давай разберёмся, почему»
- **Subtitle:** «Приключение с лампочкой для любопытных детей»
- Glowing animated bulb (idle breathing glow), hint «Нажми →, чтобы начать».
- Notes: how to run the deck; mention offline.

### Slide 1 — Meet your bulb
- Big bulb SVG + a phone/app card showing `R 255 · G 255 · B 255`.
- Fragment 1: «Эта маленькая лампочка говорит, что умеет светить **16 миллионов** цветов.»
- Fragment 2 (hook): «Если смотреть на новый цвет каждую секунду, днём и ночью без сна, понадобится примерно **194 дня**!»
- Notes: ask the kid to guess how many colors before revealing.

### Slide 2 — Three cups of light
- Three labeled empty glasses R / G / B appear (fragments).
- Show the three **overlapping light circles** (additive Venn: R+G=yellow, R+B=magenta, G+B=cyan, all=white) via `mix-blend-mode: screen` on a black panel.
- Copy: «Красный, зелёный и синий — это **свет**. Когда лучи накладываются, становится **ярче**, а не темнее, как с красками.»
- Fragment: «0 — выключено · 255 — ярче всего · **256 шагов** в каждой чашке.»
- Notes: physically point a torch/phone flashlight if available.

### Slide 3 — 🔬 Цветовая лаборатория (главная площадка)
- Layout: three cups on the left, bulb + readout on the right. On portrait tablets, stack (cups row on top, bulb below).
- Full interaction spec in §7. Readout shows a swatch, `rgb(255, 128, 0)`, `#FF8000`, and a friendly name if close to a known color.
- Hint chips (clickable presets): «☀️ Солнце», «🌊 Океан», «🌱 Трава», «🍬 Жвачка», «🌙 Ночь», «🔴 Только красный».
- A «🎮 Играть стрелками» toggle explains that clicking a cup lets arrow keys control it (see §7.5 for the reveal.js key conflict solution).
- Notes: let the child explore 3–5 minutes before advancing.

### Slide 4 — One cup: 256 brightness steps
- Zoom the Red cup. Beside it, a tall thin canvas strip `1 × 256` scaled up (`image-rendering: pixelated`) from black (0) to pure red (255).
- Labels at `0 · 64 · 128 · 192 · 255`; a pill "**256 steps**".
- Animated counter `0 → 255` as the strip fills.
- Copy: «Одна чашка уже даёт **256** разных красных — от полной темноты до самого яркого красного.»

### Slide 5 — Two cups: 256 × 256 = 65,536
- Render the **256×256 grid** (canvas) where cell `(x, y)` = `rgb(x, y, 0)`: red on the X axis, green on the Y axis, blue fixed at 0.
- Fragment the equation: `256 × 256 = 65,536`.
- Copy: «Две чашки! Целое **поле из 65 536 цветов**. Но это ещё не 16 миллионов… Что мы забыли?»
- Optional micro-interaction: hovering/tapping a cell highlights its `(r,g)` values and paints the bulb — keep it cheap (single canvas, hit-test by pixel coords).
- Notes: 65,536 is already "more than you could count in one day".

### Slide 6 — Three cups: the color cube → 16,777,216
- Show a **3D-ish cube illustration** built from stacked 2D grids (CSS 3D transforms or an isometric canvas drawing) labeled `256 × 256 × 256`.
- Fragment the equation and run the **animated counter** `0 → 16 777 216`.
- Copy: «К каждому из этих 65 536 листов добавляется целая стопка из 256 синих. Получается `256 × 256 × 256 = 16 777 216`.»
- Punch line fragment: «**Вот откуда берутся 16 миллионов. Это не волшебство — это умножение!**»
- Notes: pause the counter and ask the kid to predict.

### Slide 7 — Разрушители мифов («Погоди… правда?»)
- Three flip/reveal cards (fragments or a vertical stack), Russian:
  1. **«255,255,255»** → «Это не 255 миллионов цветов. Это рецепт самого яркого белого: все чашки полны.»
  2. **«16 миллионов или 16,7 миллиона?»** → «`256 × 256 × 256 = 16 777 216`. «16 миллионов» — это округлённое доброе имя.»
  3. **«Свет или краска?»** → «Свет складывается в белый. Краска складывается в коричневый. Твоя лампочка смешивает **свет**.»
- Optional 4th card: «В некоторых лампочках есть ещё белый свет или ручка тёплого/холодного света — тогда цветов ещё больше!»

### Slide 8 — 🎯 Найди такой цвет
- Same cups + bulb, but with a **target swatch** and a tolerance (start ±24 per channel).
- Targets (in order): ☀️ «Солнце» `(255,220,0)`, 🌊 «Океан» `(0,120,255)`, 🌱 «Трава» `(40,200,60)`, 🍬 «Жвачка» `(255,105,180)`, 🌙 «Выключить» `(0,0,0)`, 🎁 «Сюрприз» (случайный).
- On match: checkmark, a short confetti burst (CSS particles; respect reduced motion), and a «1,2,3…» badge count of colors solved. «Пропустить» always available so a 9-year-old never gets stuck.
- Copy: «Ты нашёл 1 цвет из 16 777 216. Найдёшь ещё один?»

### Slide 9 — Что мы узнали
- Three big recap cards (Russian):
  1. «В каждой чашке **256** шагов (0 тоже считается!).»
  2. «Три чашки перемножаются: `256 × 256 × 256`.»
  3. «Получается **16 777 216** цветов — примерно 16,7 миллиона.»
- Badge: «Теперь ты — **Смешиватель Света**! 🔦»
- Notes: invite the kid to teach it back.

### Slide 10 — Для взрослых (optional, `data-visibility="uncounted"` or a hidden slide)
- 24-bit color = 8 bits × 3 channels; `2⁸ = 256` per channel.
- Hex shorthand: `#RRGGBB`, each pair `00–FF`.
- Additive vs subtractive color models.
- Notes: how to run/build offline (§13).

---

## 6. Deliverable file tree

```
rgb-bulb/
├── docs/
│   ├── plan/
│   │   └── 20261018_021427_9c087dca_rgb-cups-16-million-colors.md   # this file
│   └── README.md                      # (optional) short "how to run for parents"
├── index.html                         # reveal.js presentation root
├── src/
│   ├── css/
│   │   ├── theme.css                  # colors, typography, reveal overrides
│   │   └── components.css             # cups, bulb, grid, cube, cards, confetti
│   └── js/
│       ├── main.js                    # reveal init + wiring, slide lifecycle
│       ├── util.js                    # clamp, toHex, toRgbString, luminance, lerp
│       ├── state.js                   # createColorStore + shared instances
│       ├── cup.js                     # createCup(...)
│       ├── bulb.js                    # createBulb(...)
│       ├── lightmix.js                # additive overlapping circles
│       ├── grid2d.js                  # renderRGBAxesGrid(canvas, opts)
│       ├── cube.js                    # createColorCube(...)
│       ├── counter.js                 # animateCount(el, to, opts)
│       ├── challenges.js              # createChallenge(...)
│       └── i18n.js                    # RU string dictionary (EN fallback for devs)
├── assets/
│   ├── bulb.svg                       # bulb artwork (inline-able)
│   ├── icons/                         # sun, wave, leaf, candy, moon, gift (SVG)
│   └── fonts/                         # bundled woff2 with Cyrillic subset (Comfortaa/Nunito)
├── public/
│   └── vendor/                        # (if not importing reveal via bundler)
├── tests/
│   ├── unit/util.test.js              # Vitest
│   └── e2e/smoke.spec.js              # Playwright (optional)
├── package.json
├── vite.config.js
├── playwright.config.js               # optional
└── README.md
```

---

## 7. Interaction specification

### 7.1 Shared color state
All widgets on a slide share **one** store instance so the Playground and Challenge slides stay independent (create one store per interactive slide, or one global store reset on `slidechanged` — implementer's choice; recommended: **one store per interactive slide** to avoid cross-slide coupling).

```js
// src/js/state.js
export function createColorStore(initial = { r: 0, g: 0, b: 0 }) {
  const state = { ...initial };
  const subs = new Set();
  const emit = () => subs.forEach(fn => fn({ ...state }));
  return {
    get: () => ({ ...state }),
    set(channel, value) {
      if (!['r', 'g', 'b'].includes(channel)) return;
      state[channel] = clamp(Math.round(value), 0, 255);
      emit();
    },
    setRGB(r, g, b) { state.r = clamp(r|0,0,255); state.g = clamp(g|0,0,255); state.b = clamp(b|0,0,255); emit(); },
    subscribe(fn) { subs.add(fn); fn({ ...state }); return () => subs.delete(fn); },
  };
}
```

### 7.2 Cup component
`createCup({ channel: 'r'|'g'|'b', color, store, mountEl, showTicks, onInteract })`

**Rendering**
- A vertical glass (rounded rect) with:
  - a **liquid layer** whose height = `value / 255 × innerHeight` from the bottom;
  - a **fill-line** (drag handle) at the liquid top, `cursor: ns-resize`;
  - subtle **16-step gridlines** (repeating-linear-gradient) to hint at the 256 rows, with sparse numeric labels (`0, 64, 128, 192, 255`);
  - a **value badge** (`aria-hidden` duplicate of the ARIA value) showing the current 0–255 number;
  - two big **± / ▲▼ buttons** (≥44×44 px touch target) for ±1; long-press repeats (~80 ms after 400 ms).
- Rows concept: because 256 rows are sub-pixel on screen, expose the "256 rows" idea on **Slide 4** as a magnified `1×256` canvas, not in the working cup. In the working cup, show 16 gridlines + smooth fill.

**Inputs**
1. **Pointer / touch drag** the liquid or the glass body: `value = round((1 - (y - top) / height) * 255)`. Use Pointer Events; call `setPointerCapture`. Batch with `requestAnimationFrame`.
2. **Tap on the glass** jumps the fill to the tapped level.
3. **Click ▲/▼** adjusts ±1; hold repeats.
4. **Keyboard** (when the cup has focus — see §7.5): `↑/↓` ±1, `Shift+↑/↓` ±16, `PageUp/PageDown` ±64, `Home` = 0, `End` = 255.
5. **Hidden range input** for assistive tech/automation: `<input type="range" min="0" max="255" aria-label="Красный свет">` visually clipped but focusable; two-way synced with the store. (Can replace role slider — see §10.)

**Events**
- Emit changes only through the store (`store.set`). Subscribe to store to re-render (so presets/challenges can set values programmatically).

### 7.3 Bulb component
`createBulb({ mountEl, store })`
- Inline SVG: glass outline, filament, inner glow layer, outer halo.
- On store change:
  - fill color = `rgb(r,g,b)`;
  - `opacity` of the lit layer ramps with perceived brightness (use `luminance()` or `max(r,g,b)/255`) so `(0,0,0)` looks truly dark and `(255,255,255)` blazes;
  - CSS `filter: drop-shadow(0 0 Npx rgb(r,g,b))` and a slide-background radial tint (`--glow`) for drama.
- Show `rgb()` and `#hex` readouts; choose text color by background luminance for contrast.
- Optional friendly name lookup for near-matches (small table only; never block on it).

### 7.4 Light mixer (additive Venn)
- Three circles with `mix-blend-mode: screen` over a black panel; each circle's opacity tied to its channel value.
- Demonstrates additive mixing independent of the bulb.

### 7.5 Reveal.js key conflict — REQUIRED solution
Reveal.js uses ↑/↓/←/→/Space for navigation. The cups need ↑/↓.
**Chosen approach (focus-scoped capture):**
- Interactive slide adds `data-state`/class `keyboard-local`.
- On `.cup` `focusin`: set a flag and register `document.addEventListener('keydown', handler, true)` that, for the handled keys, calls `event.preventDefault()` **and** `event.stopImmediatePropagation()` so Reveal never sees them.
- On `focusout`/`Escape`: remove the capture. `Escape` also `blur()`s the active cup.
- The slide always provides visible **Next/Prev** buttons and mouse drag, so a child is never trapped. A small inline hint appears while capture is active: «Стрелки двигают чашку · Esc — вернуться к слайдам».
- Left/Right remain slide navigation *unless* they are explicitly repurposed (they are not; cups use Up/Down only).
- **Acceptance check:** with a cup focused, ↑/↓ change the channel by ±1 and the slide does not move; `Esc` returns arrow navigation.

### 7.6 Reduced motion
- Wrap counter, confetti, and glow-pulse in `@media (prefers-reduced-motion: reduce)` guards; provide instant/static fallbacks.

---

## 8. Visual design

### 8.1 Theme
- Dark "light lab": background `#0b0e17` with subtle radial vignette; text `#f5f7ff`.
- Channel colors: `--red:#ff3b3b`, `--green:#28d17c`, `--blue:#3b7bff`.
- Accent: warm white `#ffe8a3` for highlights.
- Rounded, friendly, high-legibility font **with a Cyrillic subset**. **Bundle locally** (offline requirement): `Comfortaa` or `Balsamiq Sans` for headings, `Nunito` for body. Verify the `cyrillic` unicode-range woff2 files are included, otherwise Russian text falls back to an ugly default.
- Big type for kid slides (min ~28 px at 1280×720 after reveal scaling), generous spacing.

### 8.2 Layout rules
- Two-column for the Playground; single-column stack on `max-width: 900px` (portrait tablets).
- Bulb always visible on the same slide as the cups.
- Never put essential info only in a hover state (touch devices).

### 8.3 reveal.js configuration
```js
// index.html must declare <html lang="ru">
Reveal.initialize({
  hash: true,
  slideNumber: 'c/t',
  controls: true,
  progress: true,
  transition: 'slide',
  backgroundTransition: 'fade',
  width: 1280, height: 720, margin: 0.04,
  minScale: 0.2, maxScale: 1.6,
  plugins: [RevealNotes],
});
```
- Register per-slide init on `slidechanged` / `ready`; **pause/destroy** canvas animations and listeners when leaving a slide to protect performance.

---

## 9. Technical stack & dependencies

- **Node 22** (already installed; npm 10).
- **Vite** (dev server + static build). Static `dist/` output works offline.
- **reveal.js** (latest 5.x) imported via bundler; CSS from `reveal.js/dist/reveal.css` plus a custom theme.
- **No runtime CDN** calls — bundle everything.
- **Vitest** for unit tests; **Playwright** optional for one smoke test.
- Pure DOM/SVG/Canvas APIs; no UI framework.

### 9.1 Key formulas (single source of truth in `util.js`)
```js
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v)));
export const toHex = (r,g,b) =>
  '#' + [r,g,b].map(v => clamp(v,0,255).toString(16).padStart(2,'0')).join('').toUpperCase();
export const toRgbString = (r,g,b) => `rgb(${clamp(r,0,255)}, ${clamp(g,0,255)}, ${clamp(b,0,255)})`;
export const luminance = (r,g,b) => 0.2126*r + 0.7152*g + 0.0722*b; // 0..255
export const TOTAL_COLORS = 256 ** 3; // 16_777_216
```

### 9.2 Canvas grid (performance)
```js
// draw 256x256 cells into an offscreen ImageData, then scale with CSS
// image-rendering: pixelated; canvas { width:256px; height:256px; }
for (let y = 0; y < 256; y++)
  for (let x = 0; x < 256; x++) {
    const i = (y*256 + x) * 4;
    data[i] = x; data[i+1] = y; data[i+2] = 0; data[i+3] = 255;
  }
```
Never build 65,536 DOM nodes. Same rule for the cube preview (illustrative layers only).

---

## 10. Accessibility

- Each cup is a proper slider: `role="slider"`, `aria-valuemin="0"`, `aria-valuemax="255"`, `aria-valuenow`, `aria-orientation="vertical"`, `aria-label="Красный свет"` / `"Зелёный свет"` / `"Синий свет"`. Prefer a real visually-hidden `<input type="range">` driving it (best screen-reader/keyboard support) with the decorated glass as the visual layer. Ensure no `aria-hidden` on focusable elements.
- Live region for the mixed color: `aria-live="polite"`, Russian: «красный 255, зелёный 128, синий 0» (или «#FF8000»), **throttled to ~500 ms** to avoid a flood.
- Screen readers must use Russian voices: set `<html lang="ru">` and `lang="ru"` on dynamic announcements where needed.
- Visible focus rings; full keyboard operability; `Escape` exits cup capture.
- Contrast: compute text color from the dynamic swatch luminance; never color-alone (always show numbers/hex).
- Touch targets ≥ 44 px; support pinch-zoom (don't disable viewport scaling).
- Honor `prefers-reduced-motion`.
- Provide alt text / `role="img"` + `aria-label` on the bulb and decorative SVGs.

---

## 11. Performance budgets

- Time-to-first-slide < 2 s locally; total JS bundle < ~300 KB gzip (excluding font).
- No layout thrash during drag: read geometry once on `pointerdown`, then only mutate CSS variables/`style` in `rAF`.
- One animation loop per active visual; stop when slide is not active or tab is hidden (`visibilitychange`).
- Target 60 fps on a mid-range laptop and an iPad (2020+).

---

## 12. Implementation task breakdown

> Each task lists files, dependencies, and a done-definition. Tasks T1–T3 can start in parallel after T0.

| ID | Task | Files | Depends | Done when |
|----|------|-------|---------|-----------|
| **T0** | Scaffold Vite + reveal.js project, folder tree, offline fonts, theme skeleton | `package.json`, `vite.config.js`, `index.html`, `src/css/*`, `README.md` | — | `npm run dev` serves a blank deck; `npm run build` produces static `dist/` that opens with `file://` or a static server and has **zero** network requests |
| **T1** | Utils + state store + unit tests | `src/js/util.js`, `src/js/state.js`, `tests/unit/util.test.js` | T0 | `toHex(255,128,0) === '#FF8000'`, clamp/round/luminance tests pass; `TOTAL_COLORS === 16777216` |
| **T2** | Cup component (pointer, tap, buttons, keyboard, a11y) | `src/js/cup.js`, `src/css/components.css` | T1 | Dragging/typing changes store; store changes re-render; slider ARIA correct |
| **T3** | Bulb component + readout | `src/js/bulb.js`, `assets/bulb.svg`, `src/css/components.css` | T1 | Bulb + rgb/hex update live; black is dark, all-255 blazes |
| **T4** | Additive light mixer | `src/js/lightmix.js` | T1 | Overlaps match R+G=yellow, G+B=cyan, R+B=magenta, all=white |
| **T5** | Slide 3 Playground wiring + presets | `index.html`, `src/js/main.js` | T2,T3,T4 | Preset chip sets all three cups and bulb; focus-scoped arrow capture works (§7.5) |
| **T6** | Slide 4: 1×256 strip + counter | `src/js/grid2d.js`, `src/js/counter.js` | T1 | 256-step strip renders pixelated; counter animates 0→255 |
| **T7** | Slide 5: 256×256 grid | `src/js/grid2d.js` | T1 | Canvas shows full R×G field; optional hover paints bulb |
| **T8** | Slide 6: cube illustration + 16,777,216 counter | `src/js/cube.js`, `src/js/counter.js` | T1 | Cube illustrated; counter ends exactly at 16 777 216 |
| **T9** | Slide 8: challenges + confetti | `src/js/challenges.js`, `src/css/components.css` | T2,T3 | All 5 targets solvable; match detected within tolerance; confetti respects reduced motion; skip works |
| **T10** | Russian copy pass for Slides 0–10 + speaker notes | `index.html`, `src/js/i18n.js` | T5–T9 | All visible text natural Russian; §4.5 rules applied; no sentence > 12 words on kid slides |
| **T11** | Responsive + a11y + reduced-motion polish | `src/css/*`, components | T2–T9 | Passes §10 checklist; no horizontal scroll at 375×667 and 1024×768/portrait |
| **T12** | Optional smoke test + parent README | `tests/e2e/smoke.spec.js`, `README.md` | T0–T11 | Playwright opens deck, drags a cup, asserts readout changed (if Playwright adopted) |
| **T13** | Native-speaker review of all Russian copy | `src/js/i18n.js`, `index.html` | T10 | A Russian-speaking adult (ideally the parent) reads it aloud and approves; «ты/вы» and number/plural agreement checked |

**Suggested ownership:** one agent on T1–T2, one on T3–T4, one on T6–T9, one on T10/T11 (copy + polish). Coordinate on `src/js/main.js` and `src/css/components.css` to avoid merge conflicts (prefer one writer per file).

---

## 13. Build / run / verification

```bash
# install
npm install

# dev
npm run dev            # open the printed localhost URL

# unit tests
npm run test           # vitest run

# production build (offline-capable static output)
npm run build          # -> dist/
npm run preview        # serve dist/ to verify

# verify no runtime network calls
#   1) build, 2) serve dist/, 3) DevTools > Network > reload > expect no external hosts
```

`package.json` scripts (target):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

---

## 14. Localization

- **Russian is the product language.** Keep all user-facing strings in `src/js/i18n.js` keyed by ID (single `ru` dictionary). This keeps the HTML clean and makes a later translation easy.
- `index.html` declares `<html lang="ru">`. Default and only shipped locale: `ru`.
- English may remain in code comments and on the grown-up slide, but **never** as kid-facing fallback text. Do not machine-translate Russian copy — have a native speaker review (T13).
- Optional later: `?lang=en` for parents/other kids; not required for v1.

---

## 15. Acceptance criteria (definition of done)

1. `npm run build` produces `dist/` that runs **fully offline** with no console errors.
2. Slides 0–9 render and navigate (mouse, touch, keyboard, on-screen controls).
3. On the Playground, changing any cup updates the bulb, `rgb()`, and `#hex` within one frame; drag feels smooth (no jank).
4. Arrow-key capture works exactly as in §7.5; `Esc` restores slide navigation.
5. Slide 4 shows a genuine **256**-step red strip; Slide 5 renders **65,536** cells via canvas; Slide 6's counter ends at exactly **16,777,216**.
6. All five challenge targets are solvable; match feedback appears; "skip" always available.
7. Misconception cards M1–M4 all present (§4.3).
8. Layout is usable at 1280×720, 1024×768 (portrait), and 375×667 (phone); no essential content hidden on touch.
9. Accessibility checklist (§10) passes: slider ARIA, focus visible, keyboard-only operation, reduced-motion fallbacks, contrast.
10. Unit tests green; `TOTAL_COLORS === 16_777_216`.
11. `README.md` tells a parent how to run/open the finished page (Russian).
12. All visible strings are natural Russian (`<html lang="ru">`, Cyrillic-capable bundled fonts); no English leaks into the kid-facing UI.

---

## 16. Test checklist (manual, run before "done")

- [ ] Drag each cup from 0→255 and back; bulb follows, no flicker.
- [ ] Tap glass at top/middle/bottom sets 255/~128/~0.
- [ ] Focus a cup, press ↑/↓ — value changes, slide does **not** move. Press `Esc` — arrows navigate slides again.
- [ ] `Shift+↑`, `PageUp`, `Home`, `End` all work.
- [ ] Preset chips set expected colors («Солнце» = yellow-ish, «Океан» = blue, «Выключить» = black).
- [ ] Slide 4: count the strip's labeled rows; "256 steps" pill visible.
- [ ] Slide 5: grid looks like a red→green field; no DOM explosion in DevTools.
- [ ] Slide 6: counter visibly animates and stops at 16 777 216.
- [ ] Slide 8: solve «Солнце» and «Океан»; confetti fires; «Пропустить» works; random target loads.
- [ ] Turn on OS "reduce motion": no confetti/pulse, counters are instant.
- [ ] Screen reader (Russian voice) announces slider values and the mixed color (throttled).
- [ ] Every kid-facing label is natural Russian; Cyrillic renders in the bundled font (no tofu/garbled glyphs).
- [ ] Resize to phone portrait: cups and bulb remain usable; buttons ≥44 px.
- [ ] Disconnect the network, reload `dist/`: everything still works.

---

## 17. Risks & mitigations

| Risk | Mitigation |
|---|---|
| ↑/↓ fights reveal.js navigation | Focus-scoped capture + `stopImmediatePropagation`; visible Next/Prev; `Esc` exit (§7.5). |
| 65,536-cell grid kills performance | Canvas `ImageData`, never DOM nodes (§9.2). |
| 256 sub-pixel rows look like mush | Show 16 gridlines in the working cup; teach "256 rows" via the magnified strip on Slide 4. |
| "255 vs 256" confuses kids | Explicit 0-counts rule + "256 steps" pills everywhere (§4.2). |
| Offline requirement broken by CDN/fonts | Bundle reveal.js + fonts; verify with network disabled (§13). |
| Counter animation feels fake/unsatisfying | End on the exact value, show the equation, add the 194-days hook. |
| Copy drifts above 9-year-old reading level | Enforce §4.5 reading rules in T10; have a child read it aloud as the real test. |
| Merge conflicts across agents | One writer per file; `main.js` and `components.css` are the hot spots — sequence T5/T11. |

---

## 18. Open questions (resolve before/at kickoff)

1. **Hosting:** should `dist/` be published (GitHub Pages / local file) or only run locally for the child?
2. **Bulb realism:** photorealistic SVG vs cute cartoon bulb? (Default: cute cartoon, easier to animate and read.)
3. **White channel bonus:** include the «есть ещё белый канал» card, or keep strictly to RGB for v1? (Default: keep on the grown-up slide only.)
4. **Sound:** add gentle click/ding on cup change? (Default: off; kids' page in shared spaces.)
5. **Challenge tolerance:** fixed ±24, or "close enough" fuzzy matching with a hint arrow? (Default: ±24 with a «горячо/холодно» hint.)
6. **Address form:** the copy uses «ты». If the family prefers «вы», set a flag — but «ты» is recommended for age 9.

---

## 19. Appendix A — Ready-to-paste slide skeleton (for T5–T10)

```html
<section>
  <h2>16 миллионов цветов?! Давай разберёмся, почему</h2>
  <p>Приключение с лампочкой для любопытных детей</p>
  <div class="bulb-demo" data-bulb></div>
  <aside class="notes">Explain how to run/advance the deck before starting.</aside>
</section>

<section class="playground">
  <h2>🔬 Цветовая лаборатория</h2>
  <div class="lab">
    <div class="cups">
      <div class="cup" data-cup="r"></div>
      <div class="cup" data-cup="g"></div>
      <div class="cup" data-cup="b"></div>
    </div>
    <div class="stage">
      <div data-bulb></div>
      <div class="readout" aria-live="polite"></div>
      <div class="chips">
        <button data-preset="255,220,0">☀️ Солнце</button>
        <button data-preset="0,120,255">🌊 Океан</button>
        <button data-preset="0,0,0">🌙 Ночь</button>
      </div>
    </div>
  </div>
</section>
```

## 20. Appendix B — Copy bank, Russian (kid-friendly, reuse freely)

- «В каждой чашке — **свет**. Больше света — ярче, а не темнее.»
- «**0** — выключено. **255** — ярче всего. Если считать и 0, получается **256 шагов**.»
- «Одна чашка: **256** красных. Две чашки: **256 × 256 = 65 536**. Три чашки: **256 × 256 × 256 = 16 777 216**.»
- «**16 777 216** — это больше 16 миллионов. Поэтому мы говорим *примерно* 16 миллионов.»
- «**255,255,255** — это не 255 миллионов цветов. Это рецепт самого яркого белого: все чашки полны.»
- «Свет смешивается в белый. Краска смешивается в коричневый. Твоя лампочка смешивает **свет**.»
- «Ты нашёл 1 цвет из 16 777 216. Хочешь найти ещё?»
- «Если смотреть на новый цвет каждую секунду, понадобится примерно **194 дня**.»

---

*End of plan.*
