# Plan: Content clarity — the «куб» slide, the myths slide, challenge playability, and the grown-up slide in Russian

- **ID / filename:** `20261018_030657_08d53c07_cube-myths-challenge-grownups.md`
- **Date:** 2026-10-18
- **Status:** Implemented (TDD)
- **Depends on / cross-references:**
  - `docs/plan/20261018_025806_468c36d2_interactive-0-255-light-switch-slide.md` — item 2 (vertical-centering bug, §2A) **already covers item 9**; the switch slide itself supplies reusable building blocks (`steps-scale`, `createLightSwitch`) for the myths slide.
  - `docs/plan/20261018_030423_573e1977_deck-polish-system-theme-bulb-brightness-slides.md` — items 3–6 (system theme, bulb brightness, «Одна чашка» wording, «Две чашки» redesign). Item 7 builds directly on the redesigned «Две чашки» grid; item 10 must be themed like the rest.
  - `docs/plan/implemented/20261018_021427_9c087dca_rgb-cups-16-million-colors.md` — original pedagogy/copy rules.
  - `docs/plan/implemented/20261018_023540_084f6a85_standalone-offline-single-file-presentation.md` — build/packaging contract (keep `npm run package` self-contained).
- **Owner:** (assign)
- **Language of deliverable UI:** **Russian** — this plan translates the last remaining English slide (item 10).

---

## 1. Feedback index (what lives where)

The reviewer numbers slides by the **on-screen counter** (`c/t`, 1-based); `app/index.html` sections are 0-based.

| Feedback | On-screen | File index (`app/index.html`) | Slide | Planned in |
|---|---|---|---|---|
| #2 text starts mid-slide | all | all | centering bug | switch plan §2A |
| #3 system theme | all | all | theme | deck-polish plan §3 |
| #4 bulb dims on drag | 4 | 3 | 🔬 Цветовая лаборатория | deck-polish plan §4 |
| #5 «ослепительное сияние» | 5 | 4 | 📏 Одна чашка | deck-polish plan §5 |
| #6 «две чашки» unexplained | 6 | 5 | 🖼️ Две чашки | deck-polish plan §6 |
| **#7** cube from nowhere, all-blue | **7** | **6** | **🧊 Три чашки** | **this plan §2** |
| **#8** myths slide too dense | **8** | **7** | **🛡️ Разрушители мифов** | **this plan §3** |
| **#9** challenge slid down, unplayable | **9** | **8** | **🎯 Найди такой цвет** | **switch plan §2A (already)** + this plan §4 |
| **#10** slide in English | **10** | **10** (`uncounted`) | **👨‍👩‍👦 Для взрослых** | **this plan §5** |

---

## 2. Item 7 — «Три чашки: умножение взрывает число!» → explain the cube and the 16 million

### 2.1 Current slide (why it fails)
`app/index.html`:
```html
<section>
  <h2>🧊 Три чашки: умножение взрывает число!</h2>
  <p>Добавляем синюю чашку. Получается куб света!</p>
  <div id="cube-slide6"></div>
  <div ...>256 × 256 × 256 = <span id="counter-16m">0</span></div>
  <p class="fragment"><strong>Вот откуда берутся 16 миллионов! Это не волшебство — это умножение.</strong></p>
</section>
```
`app/src/js/cube.js` renders five identical translucent-blue `.cube-slice` divs. Problems reported and confirmed:
- **Куб берётся из ниоткуда** — no link from the 2D square of the previous slide to a 3D stack.
- **Почему 16 млн** — the `256 × 256 × 256` is asserted, not explained (no `65 536 × 256`).
- **«Три слоя все синие»** — the illustration is 5 identical blue panes, so it communicates neither "256 sheets" nor "each sheet is different".

### 2.2 Redesign — build the cube from the previous square
Heading: **«🧊 Три чашки: от квадрата к кубу»** (keep the "умножение взрывает число" idea in the punchline, not the title).

Progressive story (fragments), each with one visual step:
1. «На прошлом слайде был **квадрат** из 65 536 цветов: красный и зелёный. Это **один лист**.»
2. «Добавим синюю чашку. У синего тоже **256 шагов** — от 0 до 255.»
3. «Значит, таких листов **256** — по одному на каждую синеву. Получается **куб**.»
4. «**65 536 × 256 = 16 777 216**. Вот откуда 16 миллионов.»

Keep the animated counter `<span id="counter-16m">` ending exactly at `16 777 216` and the `256 × 256 × 256` equation.

### 2.3 Illustration spec (`app/src/js/cube.js`)
Replace the five identical panes with a labelled **isometric cube**:
- Three labelled axes (colour-coded): «Красный →», «Зелёный ↑», «Синий ↗».
- The **front face** shows the R×G field from the previous slide (a downscaled copy of `createGrid2D`'s bitmap is enough; do not build 65 536 DOM nodes).
- **Representative slices at different blues**: e.g. `B = 0, 64, 128, 192, 255`, each tinted by its own blue value so the child sees they differ (not "all the same blue").
- One highlighted sheet with the caption «один лист = 65 536 цветов».
- Optional (recommended): a **blue slider** `0…255` that selects which sheet is highlighted; dragging it walks the highlight through the cube. Reuse `createColorStore`/`util.js`. Reduced-motion aware.
- Accessibility: render as `<canvas>` with `role="img"` and a Russian `aria-label` («Куб из 256 листов по 65 536 цветов»); the slider is a real `<input type="range" min="0" max="255" aria-label="Синий свет">`.

Implementation note: a single `2D` canvas with an isometric projection is the most robust, dependency-free route (the existing CSS-3D `.cube-illustration` stays as a fallback only). Keep it under ~60 lines and re-render only on slider change.

### 2.4 Wiring
- `app/index.html`: new heading/lead/fragments and the blue-slider mount.
- `app/src/js/cube.js`: `createCubeIllustration({ mountEl, onBlueChange })` + internal slider (or return a `setBlue(v)` method).
- `app/src/js/main.js`: mount it on slide 6 as today; no cross-slide store.
- `app/src/css/components.css`: axes/labels/caption styles, light+dark tokens.

### 2.5 Acceptance
- After this slide a child can answer «откуда куб?» and «почему 65 536 × 256?».
- The illustration shows sheets at visibly different blues and a labelled 3D axis set.
- The counter ends at `16 777 216`; the equation `256 × 256 × 256` is present.
- Fits 1280×720 and 375×667; works in both themes.

---

## 3. Item 8 — «Разрушители мифов» is three dense text blocks

### 3.1 Options (the reviewer offered both)
| Option | Effort | Verdict |
|---|---|---|
| A. One slide + sequential `fragment` reveals | low | Better, but three long paragraphs still appear on one busy canvas |
| B. Split into three slides, each with an illustration | medium | **Recommended** — matches «разнести на разные слайды и добавить иллюстрации» |
| C. Reveal **vertical stack** (one horizontal slide made of three sub-slides) | medium | Equivalent to B, keeps the horizontal deck short; **recommended implementation** |

### 3.2 Recommended design — a vertical stack of three illustrated mini-slides
Wrap the myths as nested `<section>`s (reveal navigates down through them):
```html
<section><!-- myths: vertical stack -->
  <section>… «255,255,255» …</section>
  <section>… light vs paint …</section>
  <section>… 0–255 = 256 steps …</section>
</section>
```
Each sub-slide: **one big illustration + at most two short sentences** (≤ 12 words each), large type.

| Sub-slide | Illustration | Copy |
|---|---|---|
| 1. «255, 255, 255» | three full cups → one bright white swatch (`createColorStore` + `createBulb`, or simple CSS) | «Нет. Это рецепт самого яркого белого: все чашки полны.» / «А число цветов — `256 × 256 × 256`.» |
| 2. Свет или краска? | two panels: additive circles → white (`createLightMix`) vs a murky-brown paint blob (CSS) | «Свет складывается и светлеет до белого.» / «Краска вычитает цвет и темнеет.» |
| 3. 0–255 = 255 шагов? | the `steps-scale` / 1×256 strip from the switch plan, with `0` highlighted | «Нет, шагов **256**: ноль — тоже шаг.» / «Он значит „свет выключен“.» |

### 3.3 Notes
- Reuse components instead of new ones: `createLightMix` (sub-slide 2), `createStrip1D` / the switch plan's `steps-scale` (sub-slide 3).
- `initSlide()` in `main.js` already runs per **current** (sub-)slide, so mount points inside nested sections work — but confirm the `slidechanged` handler and the §2A relayout still fire on vertical navigation (they do; vertical moves dispatch `slidechanged` too).
- Keep a single short intro line on the stack's first sub-slide so the child knows there are three cards («Три частых заблуждения — по одному на карточку»), or drop it if space is tight.
- If the deck must stay a strict single horizontal row, use option A (fragments) as a fallback, but keep the illustrations.

### 3.4 Acceptance
- Each myth is on its own screen/step with an illustration; no screen shows three paragraphs at once.
- The old `.myths-grid` three-card layout is gone.
- Text is readable at 1280×720 and 375×667; works in both themes.

---

## 4. Item 9 — «Слайд 9 уехал вниз, поиграть не получается»

### 4.1 This is already item 2 / switch plan §2A
Measured earlier on the packaged build: the challenge slide (file index 8, on-screen 9) had `scrollHeight = 637` but a stale inline `top = 275` instead of `(720 − 637)/2 = 41.5` — pushed **+233 px down** and clipped, so the cups and buttons fall below the viewport. It is the *same* root cause as item 2: reveal computes the vertical-centering `top` before `initSlide()` injects the challenge UI and cups.

**No new fix is needed here** — the switch plan §2A (`Reveal.layout()` after `initSlide` + on `fonts.ready` + debounced `ResizeObserver`) resolves it.

### 4.2 What this plan adds: a hard "playable" check
Add explicit verification of the challenge slide after §2A:
- [ ] Navigate to the challenge slide **without resizing**: the three cups, the target/current swatches, «Проверить цвет!», «Пропустить ➔» and the solved counter are all fully on-screen.
- [ ] Drag each cup and confirm the «Твой свет» swatch follows.
- [ ] Solve one target and see the confetti/next target; «Пропустить» works.
- [ ] The cups are present (the T14 mount-order fix) and there are exactly three.

If, after §2A, the challenge content is still taller than 720 px, shrink that slide (the `.challenge-box` padding / cup height), do **not** hide overflow.

---

## 5. Item 10 — «Слайд 10 на английском языке»

### 5.1 Current slide
`app/index.html`, last `<section data-visibility="uncounted">` — «👨‍👩‍👦 Для взрослых (родителям)» has four English bullets (`24-bit color`, `Hex format`, `Additive color model`, `Offline capability`). The original plan allowed English only here; the reviewer now wants Russian.

### 5.2 Translate (keep the technical terms, explain in Russian)
Replace the bullets with:
- **«24-битный цвет:** по **8 бит** на канал (`2⁸ = 256`). Три канала (RGB) → 24 бита → **16 777 216** цветов.»
- **«Hex-формат:** `#RRGGBB`, где каждая пара — это число от `00` до `FF` (0–255).»
- **«Аддитивная модель:** красный + зелёный + синий = белый свет (в отличие от субтрактивной модели CMYK, где смешение красок темнеет).»
- **«Автономность:** презентация работает офлайн. При сборке (`npm run package`) получается **один файл** со встроенными шрифтами.»

Optionally add: how to open the file, keyboard controls, and the reduced-motion note — but keep it short; this is a reference card, not a manual (the README already covers operation).

### 5.3 Consistency
- The slide must follow the same system light/dark theme as the rest (deck-polish plan §3) and use the semantic tokens.
- Keep it `data-visibility="uncounted"` (it is reference material, not part of the child's journey).
- Update the `aside.notes` (already Russian) only if the wording changes.
- After this change there must be **zero English sentences** in the visible UI (grep for Latin-letter runs in `app/index.html` and in runtime strings); English stays only in code/comments.

### 5.4 Acceptance
- The grown-up slide is fully Russian, readable in both themes, and still uncounted in navigation.
- No English leaks remain anywhere visible (grep check).

---

## 6. Task breakdown

| ID | Task | Files | Depends | Done when |
|----|------|-------|---------|-----------|
| **C7.1** | Rewrite slide copy: «от квадрата к кубу», `65 536 × 256 = …`, fragments | `app/index.html` | — | Copy explains the cube and the 16M |
| **C7.2** | Rebuild `createCubeIllustration`: isometric canvas, labelled R/G/B axes, slices with different blues, front R×G face | `app/src/js/cube.js` | C7.1 | Sheets visibly differ; axes labelled |
| **C7.3** | Optional blue-slice slider `0…255` driving the highlighted sheet | `cube.js`, `main.js`, `components.css` | C7.2 | Slider walks the highlight; reduced-motion safe |
| **C7.4** | Styles + a11y (`role="img"`, `aria-label`, real range input) | `components.css`, `cube.js` | C7.2 | Accessible in both themes |
| **C8.1** | Convert the myths slide into a vertical stack of 3 sub-slides | `app/index.html` | — | Three screens, one myth each |
| **C8.2** | Illustrations: full cups→white; light vs paint; 256-step strip | `index.html`, `main.js`, `components.css` | C8.1 | Each myth has a visual |
| **C8.3** | Remove `.myths-grid` 3-card layout | `components.css` | C8.1 | No 3-paragraph screen remains |
| **C9.1** | Verify challenge playability after switch-plan §2A | — | switch §2A | §4.2 checklist passes |
| **C10.1** | Translate the grown-up slide to Russian | `app/index.html` | deck-polish §3 (theme) | No English visible |
| **C10.2** | Grep for English leaks in visible UI | repo | C10.1 | Zero matches |

Order: **C9.1 depends on the switch plan §2A** (do that first); **C7** builds on the deck-polish plan §6 (redesigned «Две чашки»); **C10** after the theme work so it does not need a second styling pass. `C8` is independent.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| An isometric canvas cube is fiddly; wrong projection looks broken | Keep it small and schematic (labelled axes + ~5 coloured sheets + one highlighted face); verify with a headless screenshot; CSS-3D fallback stays. |
| Vertical-stack myths break navigation assumptions (`initSlide`, relayout, counters) | Confirm `slidechanged` fires on vertical moves; run the §2A centering check on each sub-slide; keep the horizontal count correct. |
| Myths split makes the deck feel long | The vertical stack keeps the horizontal count unchanged; the child presses ↓ only inside that one card. |
| Duplicate work: item 9 re-fixed here by mistake | §4 explicitly says the fix lives in switch plan §2A; this plan only verifies. |
| New Russian grown-up text drifts into jargon | Keep one plain-language sentence per term; a Russian adult reads it aloud. |
| Extra height from new illustrations re-triggers clipping | The §2A `ResizeObserver` relayout keeps centering correct; still verify each slide fits 720 px. |

---

## 8. Acceptance criteria

1. The «Три чашки» slide shows *why* the cube appears (square → 256 sheets), *why* the result is `65 536 × 256 = 16 777 216`, and an illustration whose sheets are visibly different (not five identical blue panes), with labelled R/G/B axes.
2. The counter still ends at `16 777 216` and the equation `256 × 256 × 256` is present.
3. The myths content is presented one myth per screen with an illustration each; no screen shows three paragraphs.
4. The challenge slide (on-screen 9) is fully on-screen and playable without resizing: cups, swatches, both buttons and the counter visible; one target solvable.
5. The grown-up slide (on-screen 10) is entirely in Russian, themed like the rest, and still uncounted.
6. No visible English text remains anywhere in the deck.
7. Every changed slide fits 1280×720 and 375×667 in both light and dark themes; `npm test` green; `npm run package` self-contained.

---

## 9. Manual test checklist

- [ ] «Три чашки»: read the fragments in order — each builds on the previous; the cube visibly has 256 sheets with different blues; axes labelled.
- [ ] (If the slider ships) drag the blue slider — the highlighted sheet changes; no console errors; reduced-motion unaffected.
- [ ] Myths: step down through three sub-slides; each has an illustration and ≤ 2 short sentences; arrow keys and on-screen controls both work.
- [ ] Challenge: navigate there directly with the keyboard; everything is on-screen and playable; solve one target; «Пропустить» works.
- [ ] Grown-up slide: all Russian; both themes; not counted.
- [ ] `grep -n '[A-Za-z]\{4,\}' app/index.html` shows no visible English sentences (only code/attributes).
- [ ] Headless screenshots: light+dark × slides 6,7(sub),8,10 at 1280×800 and 375×667.
- [ ] `npm test` green; `npm run package` prints the self-contained line; open `web/index.html` offline.

---

## 10. Open questions

1. **Cube heading:** «от квадрата к кубу» (recommended) or keep «умножение взрывает число»?
2. **Cube interaction:** static labelled cube, or the optional blue-slice slider? (Default: static + slider if it fits.)
3. **Myths layout:** vertical stack (recommended, one horizontal slide) or three separate horizontal slides?
4. **Myth 1 illustration:** reuse the real bulb (`createBulb`, white) or a simple white swatch? (Default: swatch + three cups, cheaper.)
5. **Grown-up slide length:** four short bullets only (recommended), or also a mini "how to open/controls" recap?
6. **English rule:** is the grown-up slide the *only* place translation was wanted, or should the code comment/docstrings also be checked? (UI is the requirement.)

---

## 11. Appendix — ready-to-paste brief for the implementing agent

> **Objective:** four content/UX fixes on the live deck. Item 9 is already covered by the switch plan §2A — only verify it. Do not touch the build pipeline.
>
> 1. **Item 7 — cube slide:** rewrite the copy to build the cube from the previous R×G square (`один лист = 65 536`, `256 листов`, `65 536 × 256 = 16 777 216`); rebuild `createCubeIllustration` as a labelled isometric canvas with R/G/B axes, sheets at different blues, and the front R×G face; optionally a `0…255` blue slider; add `role="img"` + Russian `aria-label` + a real range input.
> 2. **Item 8 — myths:** convert the three cards into a vertical stack of three sub-slides, each with one illustration (full cups→white / light-vs-paint / 256-step strip) and ≤ 2 short sentences; remove `.myths-grid`.
> 3. **Item 9 — challenge:** confirm the switch plan §2A relayout makes the challenge slide fully visible and playable without resizing; verify cups, swatches, «Проверить цвет!», «Пропустить», and one solved target.
> 4. **Item 10 — grown-up slide:** translate to Russian (24-bit, hex `#RRGGBB`, additive vs subtractive, offline single-file); keep it uncounted and themed; remove all visible English. Run the visible-English grep.
> 5. Verify both themes, all changed slides at 1280×720 and 375×667, `npm test`, and `npm run package`; include the §2A centering check for the new vertical sub-slides.

---

*End of plan.*
