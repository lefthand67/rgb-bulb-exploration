# 🌈 RGB-Чашки: 16 миллионов цветов

Это интерактивная презентация для детей (примерно 9 лет), которая наглядно и просто объясняет, как работает цвет в RGB-лампочках и почему производители заявляют о «16 миллионах цветов».

---

#### Часть А — Для учителя: как пользоваться презентацией

Обычно учитель получает уже собранный файл `web/index.html`. Если его ещё нет, попросите разработчика выполнить `npm run package` (часть B) и передать вам этот один файл.

1. Сохраните файл `web/index.html` в любое место: Рабочий стол, «Документы», флешку. Больше ничего не нужно — все картинки, шрифты и код уже внутри.
2. **Дважды щёлкните** по файлу. Презентация откроется в браузере по умолчанию.
3. Если файл открылся в неподходящей программе (например, в текстовом редакторе): нажмите на него правой кнопкой → «Открыть с помощью» → выберите Chrome, Edge или Firefox.
4. Нажмите `F` для полноэкранного режима. Выйти — `F` или `Esc`.
5. Интернет не нужен: отключите сеть — презентация продолжит работать.

**Управление:**
* **Слайды:** стрелки `→` / `←`, кнопки на экране или свайп на сенсорном экране.
* **Цветовая лаборатория:** перетаскивайте «жидкость» в чашках мышкой/пальцем или нажимайте готовые кнопки («Солнце», «Океан», «Трава» и др.).
* **Точная подстройка:** щёлкните по чашке (чтобы она получила фокус), затем:
  * `↑` / `↓` — изменить на 1 шаг;
  * `Shift` + `↑` / `↓` — на 16 шагов;
  * `Alt` + `↑` / `↓` или `PageUp` / `PageDown` — на 64 шага;
  * `Home` — 0, `End` — 255.
  Пока чашка в фокусе, стрелки управляют ею (появится подсказка внизу). Нажмите `Esc`, чтобы вернуть стрелки слайдам.
* **Игра «Найди такой цвет»:** подберите цвет как на образце и нажмите «Проверить цвет!». Если трудно — «Пропустить ➔».
* `O` — обзор всех слайдов.
* **На телефоне (Android):** в портретном режиме слайды перестраиваются в одну колонку — текст и кнопки крупные, чашки удобно тянуть пальцем, слайды листаются свайпом. В горизонтальном режиме сохраняется обычный вид презентации.

**Рекомендуемые браузеры:** Chrome, Edge, Firefox последних версий.

---

#### Part B — Development, tests, and the single-file build (Podman only)

Everything runs inside the project's Podman container. Do **not** install Node,
npm, Chromium, ChromeDriver, Python, or Selenium on the host.

**Prerequisites**
- Podman (rootless is fine) and a checkout of this repository.
- Optionally `git` for cloning.

**Step 1 — build the container image (once)**
```bash
podman build -f containers/Containerfile -t rgb-bulb-dev .
```
The wrappers below build the image automatically if it is missing.

**Step 2 — install dependencies inside the container**
```bash
./containers/run.sh bash -lc 'npm ci'
```
`node_modules` lives in a named Podman volume, not on the host.

**Step 3 — run the app in development mode**
```bash
./containers/dev.sh
```
Open `http://localhost:3000`. Edit files under `app/` — Vite reloads the page.
Stop with `Ctrl+C`. In dev mode the URL hash tracks the current slide.

**Step 4 — compile the single-file teacher deliverable**
```bash
./containers/run.sh bash -lc 'npm run package'
```
This runs `build:web` and then `verify:web`.
- Output: **`web/index.html`** — one self-contained file (JS, CSS, and fonts inlined).
- `web/` is generated and **not committed**; run this command for a fresh copy.
- The same file works from `file://`, offline, and when sent via a messenger.

**Step 5 — run the full check suite (required before claiming completion)**
```bash
./containers/run.sh bash containers/test.sh
```
The script runs:
- `npm ci` (always, so a stale named volume cannot hide dependency changes);
- `npm test` — Vitest unit tests, including layout-mode helpers;
- `npm run package` + `npm run verify:web`;
- `tests/e2e/android_webdriver.py` — portrait/landscape/desktop matrix, real
  touch gestures, per-slide clipping, touch targets, orientation changes;
- `tests/e2e/visual_contracts.py` — additive light stage, bulb states, cube
  collapse, challenge data;
- `tests/e2e/centering.py` — per-layout vertical centering.

Screenshots are written to `tests/e2e/artifacts/` (gitignored).

**Step 6 — optional multi-file build for web hosting**
```bash
./containers/run.sh bash -lc 'npm run build'   # -> dist/
./containers/run.sh bash -lc 'npm run preview'
```

**Responsive layout**
- Desktop and phone landscape keep the **1280 × 720** Reveal canvas and the
  original visual design.
- Touch portrait phones/small tablets (`width <= 900`, taller than wide) use a
  **720 × 1280** canvas with `html[data-layout="portrait"]` and a dedicated
  responsive stylesheet (`app/src/css/responsive.css`).
- Reveal is pinned to slide mode with `scrollActivationWidth: 0`; otherwise
  Reveal 6 silently enters scroll view at ≤435 px and hides the controls.
- Android baseline: **Android 10+ / Chromium 84+**. Avoid `dvh`, `:has()`,
  container queries, and `aspect-ratio`.
- The manual smoke test is the operator's **Samsung A65** in portrait and
  landscape; record the exact model, Android version, and Chrome/WebView version.

**Project structure**
```
app/         ← source of the presentation. Edit here (and only here).
containers/  ← Containerfile and Podman wrappers (run/dev/test).
web/         ← generated single file for teachers. Do NOT edit by hand.
dist/        ← generated multi-file build for hosting. Do NOT edit by hand.
docs/        ← plans and instructions.
scripts/     ← build helpers (verify-web.mjs).
tests/unit/  ← Vitest unit tests.
tests/e2e/   ← Selenium/Chromium touch, layout, visual, and centering checks.
```

**Troubleshooting**
| Problem | Fix |
|---|---|
| `podman: command not found` | Install Podman on the host; no Node/Chromium install is needed. |
| The container image is stale | Rebuild: `podman build -f containers/Containerfile -t rgb-bulb-dev .` |
| `web/index.html` does not exist | Run `./containers/run.sh bash -lc 'npm run package'`. |
| Double-clicking `web/index.html` opens an editor | Right-click → "Open with" → choose a browser. |
| Russian text looks like an ordinary system font | Run `npm run verify:web`; it must report an inlined `data:font`. |
| `npm ci` fails after changing `package-lock.json` | Re-run the full container test script; it always reinstalls dependencies. |
| Want a clean rebuild | Remove `web/` and `dist/`, then re-run `npm run package` inside the container. |
