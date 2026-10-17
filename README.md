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

**Рекомендуемые браузеры:** Chrome, Edge, Firefox последних версий.

---

#### Part B — How to install, run, and compile the web form (for anyone with the repo)

**Prerequisites**
- [Node.js](https://nodejs.org/) **18 or newer** (LTS 20/22 recommended) and npm (it comes with Node).
- Check your install:
  ```bash
  node -v   # should print v18.x or newer
  npm -v    # should print 9.x or newer
  ```
  If Node is missing: install the LTS version from nodejs.org (Windows/macOS installer), `brew install node` (macOS), or your package manager / `nvm` (Linux).

**Step 1 — get the project**
Clone the repo (or copy the folder) and open a terminal **in the project root** — the folder that contains `package.json` and `vite.config.js`:
```bash
git clone <repo-url> rgb-bulb
cd rgb-bulb
```

**Step 2 — install dependencies (once)**
```bash
npm install
```

**Step 3 — run the app in development mode**
```bash
npm run dev
```
Vite prints a URL (usually `http://localhost:3000`) and opens it in your browser. Edit files under `app/` — the page reloads automatically. Stop with `Ctrl+C`. (In dev mode the URL hash tracks the current slide.)

**Step 4 — compile the single-file web form (the teacher deliverable)**
```bash
npm run package
```
This runs `build:web` and then `verify:web`.
- Output: **`web/index.html`** — one self-contained file (JS, CSS and fonts are inlined).
- Open it by double-clicking, or serve it locally if you prefer: `npx serve web`.
- `web/` is generated and **not committed** to git; run this command whenever you want a fresh copy.

**Step 5 — (optional) build the multi-file version for web hosting**
```bash
npm run build     # -> dist/
npm run preview   # serve dist/ locally to check
```

**Step 6 — run the tests**
```bash
npm test
```

**Project structure**
```
app/     ← source of the presentation. Edit here (and only here).
web/     ← generated single file for teachers. Do NOT edit by hand.
dist/    ← generated multi-file build for hosting. Do NOT edit by hand.
docs/    plans and instructions
scripts/ build helpers (verify-web.mjs, …)
tests/   Vitest unit tests
```

**Troubleshooting**
| Problem | Fix |
|---|---|
| `npm: command not found` / `node: command not found` | Node.js is not installed — install the LTS version, reopen the terminal. |
| `npm run dev` fails on port 3000 | Vite tries another port automatically; read the printed URL. To pin a port, edit `server.port` in `vite.config.js`. |
| `web/index.html` does not exist | Run `npm run package` first; the `web/` folder is only created by the build. |
| Double-clicking `web/index.html` opens an editor | Right-click → "Open with" → choose a browser. |
| Russian text looks like an ordinary system font | Run `npm run verify:web`; it must report an inlined `data:font`. If not, open an issue / rebuild. |
| The page looks broken after editing | Run `npm install` again, then `npm run package`; delete `web/` and rebuild. |
| Want a clean rebuild | Delete `node_modules/`, `web/` and `dist/`, then `npm install && npm run package`. |
