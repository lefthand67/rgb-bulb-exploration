# Plan: Ship the RGB "Cups" reveal.js deck as a double-clickable single HTML file (no install)

- **ID / filename:** `20261018_023540_084f6a85_standalone-offline-single-file-presentation.md`
- **Date:** 2026-10-18
- **Status:** Implemented (see §15 for post-implementation follow-up fixes)
- **Owner:** (assign)
- **Depends on:** `docs/plan/implemented/20261018_021427_9c087dca_rgb-cups-16-million-colors.md` (the deck itself, already implemented)
- **Language of teacher-facing deliverable:** **Russian** (README / instructions). Code, comments, and this plan stay English.

---

## 1. One-paragraph summary

The deck is built with Vite + reveal.js and today can only be opened through a dev server (`npm run dev`) or a local web server serving `dist/` (`npx serve dist`, Live Server, …). Opening `dist/index.html` by double-click fails because browsers refuse to load external ES-module scripts and local web fonts from the `file://` protocol, and because reveal.js with `hash: true` calls `history.replaceState()` which throws a `SecurityError` on `file://`. This plan refactors the project so that **(a)** the presentation source lives in a dedicated `app/` directory (the only place anyone edits), and **(b)** a generated, self-contained single HTML file is emitted to a separate `web/` directory — with reveal.js, all app JS, all CSS, and all Cyrillic-capable fonts inlined as base64 — so a teacher can copy one file to any desktop and open it by double-click, fully offline, with no Node.js, no npm, and no web server. Source and distributable never mix. For now `web/` and `dist/` are **generated locally and git-ignored** (no build artifacts in git); CI/CD will be added later. Clear step-by-step instructions for *using* the deck and *compiling* the web form are part of the deliverable (§8.6).

---

## 2. Context

### 2.1 What exists now
- `index.html` (source) — reveal.js deck markup, links CSS from `./node_modules/reveal.js/...` and `./src/css/*`, loads `./src/js/main.js` as `type="module"`.
- `src/js/*` — vanilla ES modules (`main.js`, `state.js`, `cup.js`, `bulb.js`, `lightmix.js`, `grid2d.js`, `cube.js`, `counter.js`, `challenges.js`, `util.js`, `i18n.js`).
- `src/css/theme.css`, `src/css/components.css` — theme + widgets; `theme.css` imports `@fontsource` Comfortaa/Nunito (Cyrillic subsets).
- `package.json` scripts: `dev`, `build`, `preview`, `test` (Vitest).
- `dist/` (git-ignored) — current Vite build output: **two external assets**:
  ```html
  <script type="module" crossorigin src="./assets/index-DP_YhhcI.js"></script>
  <link rel="stylesheet" crossorigin href="./assets/index-CoHIu9K3.css">
  ```
- The build already uses `base: './'`, so relative paths are correct — the remaining problems are protocol/CORS problems, not path problems.

### 2.2 Who the deliverable is for
A teacher or parent who is **not** technical. They should be able to:
1. Receive/copy **one file** (or a tiny folder).
2. Double-click it.
3. See the presentation in their default browser, offline.
4. Never see a terminal, Node.js, npm, or a "start a local server" instruction.

A second audience is **anyone who has the repo cloned** (a developer, a colleague, a future maintainer) and needs to rebuild that one file. They should be able to do it from a clean checkout by following the README verbatim, without prior knowledge of this project.

The deck is in Russian and teaches why an RGB bulb has ~16.7M colors (see the implementation plan for pedagogy).

---

## 3. Root-cause analysis: why double-clicking `dist/index.html` fails today

| # | Symptom in DevTools | Root cause | Fix in this plan |
|---|---------------------|------------|------------------|
| **B1** | `Access to script at 'file:///…/assets/index-*.js' from origin 'null' has been blocked by CORS policy` | ES **module scripts fetched with `src=`** are always fetched with the CORS protocol. On `file://` the origin is opaque (`null`), so the fetch is blocked. (WHATWG/html#8121, MDN "CORS request not HTTP".) | Bundle everything into a **single HTML file** and inline the JS. An **inline** `<script type="module">` is *not* fetched, so it executes on `file://` even when it has no external imports. |
| **B2** | `Cross-Origin Request Blocked … .woff2 (Reason: CORS request not http)` — Russian text falls back to a system font | `@font-face` is fetched in CORS mode. Chrome blocks local `file://` font loads. Firefox exempts `.woff`/`.woff2` since v70; Safari does not enforce CORS for fonts, but Chrome does. | Inline every font as a **`data:font/…;base64,…`** URL in the CSS. `data:` URLs are not subject to the same-origin restriction. |
| **B3** | `Uncaught SecurityError: Failed to execute 'replaceState' on 'History': A history state object with URL 'file:///…' cannot be created in a document with origin 'null'` | `Reveal.initialize({ hash: true })` writes the current slide to the URL via `window.history.replaceState(window.location.pathname + search)` on the first write (hash `"/"`). Chromium marks this WontFix for `file://`. | Set `hash: false` when `window.location.protocol === 'file:'` (keep `hash: true` for dev/hosted builds). `history` stays `false` (reveal default). |
| **B4** | 404 for `index-*.js.map`; large useless file | `build.sourcemap: true` emits external `.map` files. Useless in a single-file build. | `sourcemap: false` for the single-file build. |
| **B5** | (not a bug) `crossorigin` attributes on inlined tags | Harmless for inline content; no effect once there is no `src`/`href` fetch. | Nothing to do; optionally strip. |

> **Important nuance (B1):** inline module scripts are allowed on `file://`. The blocker is only **external** module scripts and their imports. A fully bundled inline module with no static `import` statements runs everywhere (Chrome, Edge, Firefox, Safari). This is why a single-file build works without a server.
>
> **Important nuance (B2):** `data:` font URIs are the only cross-browser-safe way to ship the Cyrillic fonts. Firefox alone would tolerate `file://` fonts; Chrome/Edge would not.

### 3.1 What is **not** a problem on `file://` (so we don't over-engineer)
- Plain `<style>` blocks and inline `<script>` (classic or inline module).
- `<canvas>` / `ImageData` (slides 4–6).
- `canvas-confetti` (pure DOM/canvas, no network).
- `mix-blend-mode`, CSS gradients, SVG injected with `innerHTML`.
- `window.matchMedia`, `requestAnimationFrame`, Pointer Events.
- `localStorage`/`sessionStorage` — **not used** by the deck (reveal's scroll mode uses `sessionStorage`, but scroll mode is not enabled).

---

## 4. Goals & non-goals

### 4.1 Goals
1. **One source of truth:** all hand-edited presentation code lives under `app/`.
2. **Dedicated, separated output:** the single-file teacher artifact is generated into `web/index.html`; the optional multi-file hosting build goes to `dist/`. Neither output directory is ever hand-edited or mixed with source.
3. `web/index.html` is a **single file** containing markup + JS + CSS + fonts; opening it from `file://` shows a working deck.
4. Zero external requests and **zero console errors** when opened offline.
5. Russian text renders in the bundled **Comfortaa/Nunito** (no tofu, no fallback), because fonts are inlined.
6. Existing dev workflow stays intact: `npm run dev`, `npm run build` (multi-file `dist/`), `npm test`.
7. One reproducible command produces the shareable artifact: `npm run package`.
8. An automated verification script fails the build if the artifact is not self-contained.
9. **Documentation:** `README.md` contains clear, copy-pasteable instructions for (a) using the deck, and (b) installing, running, and compiling the web form from a fresh clone. A new contributor can follow them without asking questions.

### 4.2 Non-goals
- No service worker, PWA manifest, or install prompt.
- No Electron/Tauri/native wrapper.
- No change to the deck's pedagogy, copy, or slide content.
- No CDN usage at runtime.
- No multi-language support.
- Not fixing browsers that disable JavaScript entirely, or the long-dead IE/legacy Edge.
- No npm workspaces / monorepo tooling — the two directories are a source → artifact relationship, not two products.
- **No generated artifacts committed to git for now** (`web/` and `dist/` are git-ignored). CI/CD and artifact publishing come later.

---

## 5. Chosen approach

**Restructure into `app/` (source) + `web/` (generated single-file) + `dist/` (generated multi-file), build the single file with `vite-plugin-singlefile`, and add a targeted runtime fix for reveal's hash option.**

### 5.1 Repository layout — one source, dedicated (git-ignored) targets

```
rgb-bulb/
├── app/                          # ── SOURCE (the only place anyone edits) ──
│   ├── index.html                # deck markup
│   ├── src/
│   │   ├── js/                   # main.js, state.js, cup.js, …
│   │   └── css/                  # theme.css, components.css
│   └── assets/                   # bulb.svg, icons, …
├── web/                          # ── GENERATED, git-ignored ── the teacher artifact
│   └── index.html                # single self-contained page (double-click to open)
├── dist/                         # ── GENERATED, git-ignored ── optional hosting build
├── docs/
│   ├── plan/                     # plans (this file, implemented/)
│   └── teacher-ru.md             # (optional) printable Russian "how to open"
├── scripts/
│   ├── verify-web.mjs            # self-containment checker
│   └── package-web.mjs           # (optional) zip for classroom hand-off
├── tests/
│   └── unit/util.test.js         # Vitest
├── package.json                  # tooling lives at the repo root
├── vite.config.js                # root:'app', outputs to ../web or ../dist
├── README.md
└── .gitignore
```

**Why this layout (the architectural call):**

| Aspect | Verdict |
|---|---|
| Separate **source** from **generated output** | ✅ Good — standard practice; prevents accidental hand-edits of build artifacts. |
| Dedicated dir **per distribution target** (`web/` = double-click page, `dist/` = hosted multi-file) | ✅ Good — the build pipeline is self-documenting; each target is independently consumable. |
| **Two hand-maintained copies** of the same deck | ❌ Bad — guaranteed drift, double editing. **Not what we do.** |
| `web/` is derived from `app/` by a build command | ✅ This is the model. `web/index.html` is generated data. |
| When would two maintained products make sense? | Only if the forms genuinely diverge (e.g. a different interactive "lab" app). Then use npm workspaces with shared content modules. Overkill now. |

**Enforcement rules (must be explicit in `README.md`):**
1. Edit only `app/` (and `docs/`, `scripts/`, `tests/`). **Never edit `web/index.html` or `dist/` by hand** — they are overwritten by the build.
2. The build is the only writer of `web/` and `dist/`.
3. For now, generated output is **not committed**. Each person builds it locally with `npm run package`. (A future CI/CD job can build, verify, and publish `web/index.html`.)

> Naming note: `web/` is used for the double-clickable page and `dist/` for the conventional Vite multi-file build. If the team prefers, `web/` can be named `portable/` or `single-file/`; the important part is the role, not the name. `app/` is the source root either way.

### 5.2 Tooling
- Add dev dependency [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile) (latest **2.3.3**, MIT). It:
  - sets `build.assetsInlineLimit = () => true` → **all** assets (including the woff/woff2 fonts) are inlined as base64 `data:` URLs;
  - sets `build.cssCodeSplit = false` and `assetsDir = ''`;
  - sets `build.rollupOptions.output.inlineDynamicImports = true`;
  - inlines the emitted JS `<script>` and CSS `<link>` into the HTML and deletes the external files.
- The result is exactly one presentation file and no other emitted presentation assets.
- `removeViteModuleLoader: true` strips the (now useless) module-preload polyfill. Optional but tidy.

### 5.3 The reveal.js `hash` fix (required for `file://`)
`app/src/js/main.js` currently calls:
```js
Reveal.initialize({ hash: true, /* … */ });
```
Change to protocol-aware:
```js
// On file://, reveal's hash:true calls history.replaceState(location.pathname),
// which throws SecurityError in Chromium. Disable hash URLs for local files.
const useHash = window.location.protocol !== 'file:';

Reveal.initialize({
  hash: useHash,
  history: false,
  // …rest unchanged
});
```
This keeps deep links while developing/serving and removes the exception when opened from disk. `readURL()` only *reads* `location.hash` and is safe.

### 5.4 CSS imports after moving the source into `app/`
Under `root: 'app'`, the current `<link href="./node_modules/reveal.js/...">` paths would resolve against `app/` and break. Move all CSS into `app/src/js/main.js` imports so Vite resolves them and controls order deterministically:
```js
// app/src/js/main.js — top of file, before other imports
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
import '../css/theme.css';
import '../css/components.css';
```
Then remove the four `<link rel="stylesheet">` tags from `app/index.html`. In production the CSS is extracted/inlined; in dev Vite injects it. This also removes the fragile `node_modules` path from HTML.

---

## 6. Alternatives considered

| Alternative | Why not chosen |
|---|---|
| Keep `dist/` and tell teachers to run `npx serve dist` / Live Server | Requires Node or a browser extension; exactly what the request asks to avoid. |
| Ship a `.bat`/`.command` that starts `python -m http.server` | Requires Python, shows a terminal window, firewall prompt, and a manual URL — fragile for non-technical users. |
| Tell users to launch Chrome with `--allow-file-access-from-files` | Requires editing shortcuts / command line; security-weakening; not portable. |
| Electron/Tauri desktop app | Huge download, build toolchain, OS-specific binaries; massive overkill. |
| Host on GitHub Pages / web host | Needs internet; the requirement is offline desktop use; also not "click a file". |
| Single file but reference fonts relatively | Chrome blocks `file://` fonts (B2). Must be `data:` URIs. |
| Hand-write one HTML with UMD reveal + confetti | Loses Vite workflow, manual dependency pinning, error-prone; `vite-plugin-singlefile` is the maintained, standard route. |
| Keep `type="module"` but inline only JS (no fonts) | Fixes B1 but leaves B2 (broken Cyrillic) and B3 (SecurityError). |
| Two hand-maintained source trees (`app/` and `web/` both edited) | Duplication and drift; one slide change would need two edits. Rejected — `web/` is generated only. |
| Commit the generated `web/index.html` to git | Rejected for now by request; CI/CD will handle build + publish later. |

---

## 7. Implementation tasks

> T1 is a one-time restructure; T2–T4 are the critical path. T5–T6 harden and document. T7–T9 are optional polish.

| ID | Task | Files | Depends | Done when |
|----|------|-------|---------|-----------|
| **T0** | Add `vite-plugin-singlefile` dev dependency | `package.json`, `package-lock.json` | — | ✅ `npm i -D vite-plugin-singlefile` installs; lockfile updated |
| **T1** | **Restructure:** move source into `app/`, set Vite `root`, move CSS to JS imports | `app/**`, `vite.config.js`, `app/index.html`, `app/src/js/main.js` | T0 | ✅ `npm run dev` serves the deck from `http://localhost:3000/`; no source file remains at the repo root except tooling/docs |
| **T2** | Add `web` mode to Vite config + scripts | `vite.config.js`, `package.json` | T1 | ✅ `npm run build:web` emits exactly one file: `web/index.html`; `npm run build` still emits `dist/` |
| **T3** | Make reveal `hash` protocol-aware | `app/src/js/main.js` (+ optional `util.js` helper and unit test) | — | ✅ Opened from `file://`, no `SecurityError`; over http(s), hash URLs still work |
| **T4** | Build + inspect the artifact | `web/index.html` | T2,T3 | ✅ No `<script src>`, no external `<link rel=stylesheet>`, fonts appear as `data:font/...;base64`, `<html lang="ru">` present |
| **T5** | Automated self-containment checker + `package` script | `scripts/verify-web.mjs`, `package.json` | T4 | ✅ `npm run package` exits 0 only if `web/` is self-contained |
| **T6** | `.gitignore` (ignore `web/`, `dist/`) + full README instructions | `.gitignore`, `README.md`, optional `docs/teacher-ru.md` | T4 | ✅ Fresh clone → `npm install && npm run package` documented verbatim; "edit only `app/`" rule documented; no build output tracked by git |
| **T7** | (Optional) Font trimming for size | `app/src/css/theme.css` or new `app/src/css/fonts.css` | T4 | Not implemented |
| **T8** | (Optional) Playwright `file://` smoke test | `tests/e2e/web.spec.js`, `playwright.config.js` | T4 | Not implemented |
| **T9** | (Optional) Zip packaging for classroom hand-off | `scripts/package-web.mjs`, `package.json` | T5 | Not implemented |
| **T10** | (Future) CI/CD: build, verify, publish `web/index.html` | `.github/workflows/*`, etc. | T5 | Out of scope now; noted so the layout supports it |
| **T11** | **Fix test suite after restructure:** Vitest inherited Vite's `root: 'app'` and found no tests; unit test imported the old `src/js/util.js` path | `vitest.config.js`, `tests/unit/util.test.js` | T1 | ✅ `npm test` runs 11 tests from the repo root and passes |
| **T12** | Fix text overflowing the 1280×720 slide canvas and locally huge fonts | `app/src/css/theme.css`, `app/src/css/components.css`, `app/index.html` | T4 | ✅ Base font 30px, headings 1.45/1.6em, `text-transform:none`; every slide fits at 1280×800 (verified with headless Firefox screenshots) |
| **T13** | Make cup dragging smooth (was only jumping 0↔255); extract a testable pure helper | `app/src/js/cup.js`, `app/src/js/util.js`, `tests/unit/util.test.js` | T4 | ✅ Capture-phase pointer handling + relative drag; `dragValue()` unit-tested |
| **T14** | Fix the challenge slide: cups were destroyed by `innerHTML` and never shown; redesigned the layout | `app/src/js/challenges.js`, `app/src/js/main.js`, `app/src/css/components.css` | T4 | ✅ Three cups are mounted into `.challenge-cups` and the slide fits |

---

## 8. Exact configuration & docs

### 8.1 `vite.config.js` (`root: 'app'`, two output targets)
```js
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const web = mode === 'web'; // `vite build --mode web`

  return {
    root: 'app',              // source lives here; index.html is app/index.html
    base: './',
    plugins: web
      ? [viteSingleFile({ removeViteModuleLoader: true })]
      : [],
    server: {
      port: 3000,
      open: true
    },
    build: {
      // outDir is resolved relative to `root` (app/)
      outDir: web ? '../web' : '../dist',
      assetsDir: web ? '' : 'assets',
      sourcemap: !web,
      emptyOutDir: true
    }
  };
});
```
> `viteSingleFile()` also forces `assetsInlineLimit: () => true`, `cssCodeSplit: false`, `assetsDir: ''`, and `inlineDynamicImports: true`. Do not fight it; the `outDir`/`sourcemap` above are the only overrides needed.
>
> `emptyOutDir: true` clears `web/` and `dist/` on each build. Therefore keep hand-written files (like a teacher README) **outside** those directories, or copy them in afterwards (T9). Do not put a hand-written `web/README.txt` there for the build to delete.

### 8.2 `package.json` scripts (target)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "build:web": "vite build --mode web",
    "verify:web": "node scripts/verify-web.mjs",
    "package": "npm run build:web && npm run verify:web",
    "test": "vitest run"
  }
}
```
`--mode web` is cross-platform (no `cross-env` needed) and does not affect `npm run build`, which defaults to `production` mode → `dist/`.

### 8.3 `app/src/js/main.js` hash change
Locate the existing `Reveal.initialize({...})` block and replace the `hash: true` option:
```js
// reveal.js hash:true calls history.replaceState(location.pathname) on the first
// write, which throws SecurityError when the deck is opened from disk (file://).
// Keep hash URLs for dev/hosted use, disable them for local files.
const useHash = window.location.protocol !== 'file:';

Reveal.initialize({
  hash: useHash,
  history: false,
  slideNumber: 'c/t',
  // …unchanged…
});
```
Optional refactor for testability: add to `app/src/js/util.js`
```js
export const shouldUseHash = (protocol) => protocol !== 'file:';
```
and unit-test it in `tests/unit/util.test.js` (`shouldUseHash('file:') === false`, `shouldUseHash('https:') === true`).

### 8.4 `scripts/verify-web.mjs` (checker)
Zero-dependency Node script. Reads `web/index.html` and asserts:
1. File exists; size within a sane budget (e.g. `200 KB <= size <= 4 MB`).
2. Contains `<html lang="ru"` and `<meta charset="utf-8"`.
3. **No** external script: `/<script[^>]*\ssrc=/ i` does not match.
4. **No** external stylesheet: `/<link[^>]*\brel=["']?stylesheet/i` does not match.
5. **No** `sourceMappingURL`.
6. **Has** at least one inlined font: `/data:font\//` matches.
7. No external network URLs except the SVG namespace `http://www.w3.org/2000/svg`:
   - collect `https?://…` matches, assert every match is the SVG namespace.
8. Prints the final byte size and a ✅ line; exits `1` with a readable reason otherwise.

Suggested shape:
```js
import { readFile } from 'node:fs/promises';

const FILE = new URL('../web/index.html', import.meta.url);
const html = await readFile(FILE, 'utf8');
const fail = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };

if (!/<html[^>]*\slang=["']ru["']/i.test(html)) fail('missing <html lang="ru">');
if (/<script[^>]*\ssrc=/i.test(html))            fail('external <script src> found');
if (/<link[^>]*\brel=["']?stylesheet/i.test(html)) fail('external stylesheet found');
if (/sourceMappingURL/i.test(html))             fail('sourcemap reference found');
if (!/data:font\//i.test(html))                 fail('no inlined fonts (base64) found');

const urls = [...html.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map(m => m[0]);
const unexpected = urls.filter(u => !u.startsWith('http://www.w3.org/2000/svg'));
if (unexpected.length) fail(`external URLs found: ${unexpected.slice(0, 3).join(', ')}`);

console.log(`✓ web/index.html is self-contained (${(html.length / 1024).toFixed(0)} KB)`);
```

### 8.5 `.gitignore`
```
node_modules/
/dist/
/web/
/app/.vite/
/.vite/
/.vitest/
*.log
.DS_Store
```
`web/` and `dist/` are generated and **not committed** (per request). They are rebuilt locally with `npm run package` / `npm run build`; a future CI/CD job can build and publish them.

### 8.6 Documentation to add to `README.md` (ready to paste)

> This is the core deliverable of this task for humans. Paste the two parts below into the root `README.md`, in Russian (Part A for teachers, Part B for anyone with the repo). Keep the commands exactly as they appear.

---

#### Part A — Для учителя: как пользоваться презентацией

> Обычно учитель получает уже собранный файл `web/index.html`. Если его ещё нет, попросите разработчика выполнить `npm run package` (часть B) и передать вам этот один файл.

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
- If Node is missing: install the LTS version from nodejs.org (Windows/macOS installer), `brew install node` (macOS), or your package manager / `nvm` (Linux).

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

---

## 9. Size budget & optional font trimming

Measured on the current tree (2026-10-18):

| Component | Current | In single file (base64) |
|---|---|---|
| App JS (bundled) | 144 KB | ~144 KB |
| CSS (non-font) | ~68 KB | ~68 KB |
| Fonts — all subsets, woff **+** woff2 (4 families/weights) | ~907 KB binary | ~1.2 MB |
| Sourcemap | 351 KB | dropped (`sourcemap:false`) |
| **Single file, default** | | **≈ 1.4–1.5 MB** |

That is perfectly fine for local use. If a smaller file is desired, T7 offers two levels:

- **T7a (easy):** in `app/src/css/theme.css`, import per-subset CSS only (e.g. `@fontsource/comfortaa/cyrillic-400.css`, `latin-400.css`, `cyrillic-ext-400.css`, `latin-ext-400.css`, and the `700` equivalents) instead of the all-subsets `400.css`/`700.css`. Drops Greek + Vietnamese. Still inlines both woff2 and woff → roughly halves the font payload.
- **T7b (best):** author a tiny `app/src/css/fonts.css` with custom `@font-face` rules that reference **only the `.woff2` files** for cyrillic / cyrillic-ext / latin / latin-ext at weights 400/700 for Comfortaa and Nunito (16 files, measured **178 KB binary → ~238 KB base64**). `.woff` fallbacks are unnecessary (woff2 is supported by every browser the deck targets). Reference the files from `node_modules` or copy them into `app/assets/fonts/` for clarity, and set `unicode-range` copied from the @fontsource CSS.

Recommended default: ship the simple version, add T7a only if the file feels heavy.

---

## 10. Verification

### 10.1 Automated
```bash
npm install
npm test              # existing Vitest suite stays green
npm run package       # build:web + verify:web (self-containment gate)
```
`verify:web` (§8.4) is the automated gate. CI/CD (T10) will later run the same command.

### 10.2 Manual browser matrix (must pass before calling it done)
For Chrome, Edge, and Firefox on a desktop OS (add Safari if available):
1. Locate `web/index.html` in the file manager and **double-click** (do not drag into a server).
2. Open DevTools → Console: **no errors**.
3. DevTools → Network, reload: the only request is the HTML document (plus `data:` inline, which does not appear as a request). No `.js`, `.css`, `.woff2`, or `*.map` requests.
4. Confirm the Russian headings use Comfortaa/Nunito (not a fallback serif/sans).
5. Navigate all slides with → / ←, on-screen controls, and the progress bar.
6. On the Playground: drag each cup, click preset chips, focus a cup and press ↑/↓ (slide must not move), press `Esc` (slide navigation resumes).
7. Slides 4–6: strip, 256×256 grid, cube, and the counter ending at 16 777 216.
8. Challenge slide: solve one target, see confetti, use «Пропустить».
9. Enable OS "reduce motion", reload: no confetti/pulse, counters instant, no errors.
10. Disconnect the network, reload: everything still works.
11. Copy the single file to a different folder (and a different machine, e.g. a USB stick) and repeat step 1 — it must work with no sibling files.

### 10.3 Fresh-clone documentation test (important)
On a clean clone (or after `rm -rf node_modules web dist`), follow the README Part B **verbatim**:
- `npm install` succeeds;
- `npm run dev` opens the deck;
- `npm run package` produces a working `web/index.html`;
- an outside person can do it without asking for help.
If any step is unclear, fix the README before declaring the task done.

### 10.4 Regression & boundary checks
- `npm run dev` still serves the deck at `http://localhost:3000/` with hash URLs enabled.
- `npm run build` still produces the multi-file `dist/` and `npm run preview` serves it.
- No source file remains at the repo root (only tooling/config/docs) — confirms the restructure.
- `git status` shows **no** changes under `web/` or `dist/` (they are ignored and not tracked).
- `app/src/css/theme.css`/`components.css` content is otherwise untouched (unless T7 is implemented).

---

## 11. Acceptance criteria (definition of done)

1. Source lives under `app/`; the repo root contains only tooling (`package.json`, `vite.config.js`), generated dirs, `docs/`, `scripts/`, `tests/`, and `README.md`.
2. `npm run package` produces **exactly one** presentation output file: `web/index.html`.
3. That file contains **no** external `<script src>`, **no** external stylesheet, **no** `sourceMappingURL`, and **at least one** `data:font/...;base64,` font.
4. Double-clicking the file in Chrome, Edge, and Firefox shows the full deck with **zero console errors** and Russian text rendered in the bundled fonts.
5. DevTools Network shows no external requests when the file is opened offline.
6. reveal.js `hash` is **off** under `file://` (no `SecurityError`) and **still on** when served over http(s).
7. `npm test`, `npm run dev`, `npm run build`, and `npm run preview` keep working.
8. **No generated build output is tracked by git** (`web/` and `dist/` are ignored and absent from `git status`).
9. `README.md` contains the ready-to-paste instructions of §8.6: how a teacher uses `web/index.html`, and a step-by-step, copy-pasteable "install → run → compile the web form" guide that works from a fresh clone.
10. The generated artifact is regenerable from a clean checkout with `npm install && npm run package`.

---

## 12. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| README instructions drift from the actual scripts | Medium | §10.3 fresh-clone test; keep commands in one place and re-run it on every script change. |
| Implementer edits `dist/` or `web/` instead of `app/` | Medium | Task T1 + README "edit only `app/`" rule + `emptyOutDir` overwrites generated dirs. |
| A future browser tightens `file://` further (e.g. blocks `data:` fonts) | Low | The checker + manual matrix catch it; fallback is to ship the multi-file `dist/` plus a tiny launcher, or host it. |
| Fonts fail to inline (config regression) → Cyrillic falls back | Medium | `verify-web` **requires** `data:font/`; manual check #4 confirms rendering. |
| `hash` fix forgotten → `SecurityError` on file:// | Medium | T3 + acceptance #6; keep `history:false`; unit-test `shouldUseHash`. |
| Single file becomes too large to email (>25 MB) | Very low | Current ≈1.5 MB; T7 trimming available; checker enforces an upper budget. |
| `emptyOutDir: true` wipes a hand-written file placed in `web/` or `dist/` | Medium | Keep hand-written docs outside generated dirs, or copy them in after the build (T9). |
| Nobody rebuilds after changing `app/`, so the shared file is stale | Medium | Since artifacts are not committed, each person runs `npm run package` before sharing; README states this explicitly; a future CI/CD job will build on demand. |
| Restructure breaks paths/imports | Medium | T1 is a dedicated task with the `npm run dev` + `npm run build` regression checks in §10.4; only CSS/HTML paths change, not component logic. |
| Source CSS accidentally left with absolute `/assets/...` paths | Low | `base:'./'` is already set; checker flags external URLs. |

---

## 13. Open questions (resolve at kickoff)

1. **Directory names:** keep `app/` + `web/`, or use `app/` + `portable/`? (Role matters more than name; `web/` chosen for clarity.)
2. **Friendly filename:** keep `web/index.html`, or also emit `RGB-16-million-colors.html` / a zip for classroom hand-off?
3. **Font trimming:** ship the simple ~1.5 MB build, or do T7a/T7b now?
4. **Browser floor:** is Firefox + a Chromium browser enough, or must Safari (macOS/iPad) be in the matrix?
5. **Playwright:** add the optional `file://` e2e test (T8), or rely on the checker + manual matrix?
6. **README language:** the teacher part is Russian (default). Should the developer/build part also be Russian, or English? (Recommendation: Russian for Part A, English for Part B, since Part B is for developers.)

---

## 14. Appendix — ready-to-paste task brief for the implementing agent

> **Objective:** make the deck openable by double-clicking a single HTML file, no install, offline, with a clean source/distribution separation, and complete human instructions.
>
> 1. `npm i -D vite-plugin-singlefile`.
> 2. **Restructure:** move `index.html` → `app/index.html`, `src/` → `app/src/`, `assets/` → `app/assets/`. Set `root: 'app'` in `vite.config.js` (see §8.1). Move the four CSS `<link>`s out of `app/index.html` into imports at the top of `app/src/js/main.js` (see §5.4).
> 3. Add the `web` build mode + scripts `build:web`, `verify:web`, `package` (see §8.2). Output must be `web/index.html`; `npm run build` must still write `dist/`.
> 4. In `app/src/js/main.js`, set `hash: window.location.protocol !== 'file:'` and `history: false` in `Reveal.initialize` (see §8.3).
> 5. Add `scripts/verify-web.mjs` (see §8.4) and gate `npm run package` on it.
> 6. Update `.gitignore` to ignore `/web/` and `/dist/` (see §8.5). Do **not** commit generated output.
> 7. Paste the instructions from §8.6 into `README.md`: Part A (teacher usage, Russian) and Part B (install / run / compile the web form, step by step, copy-pasteable). Add the "edit only `app/`" rule.
> 8. Run `npm run package`; confirm `web/index.html` is self-contained. Then perform the fresh-clone test in §10.3 and the browser matrix in §10.2.
> 9. Do **not** change slide content, pedagogy, or component logic. The only source-logic change is the `hash` option; everything else is file moves, build configuration, and documentation.

---

*End of plan.*

---

## 15. Follow-up fixes (post-implementation review)

After the first successful `npm run package`, a review surfaced three user-visible
problems and one regression. All are implemented and verified.

### 15.1 Regression: the Vitest suite silently stopped running (T11)
Setting `root: 'app'` in `vite.config.js` made Vitest resolve its test root to
`app/`, so `npm test` reported **“No test files found”** and exited `1`. The
single existing test also imported the pre-restructure path `../../src/js/util.js`.

Fixes:
- Added `vitest.config.js` at the repo root that pins `test.root` to the
  repository root and `include: ['tests/**/*.test.js']`.
- Updated the import to `../../app/src/js/util.js`.
- TDD: wrote failing tests first, then implemented the helpers.

### 15.2 Typography / overflow (T12)
`reveal.js` ships a 42px base font (theme `--r-main-font-size`) and an uppercase
heading transform. Combined with `h2 { font-size: 1.8em }` and `p { 1.1em }`,
several slides exceeded the 1280×720 canvas and were clipped (“text floats past
the screen”), and individual headings looked oversized.

Fixes (`app/src/css/theme.css`):
- base `.reveal { font-size: 30px }`;
- `h1 1.6em`, `h2 1.45em`, `h3 1.15em`, `p/li 1.05em`;
- `text-transform: none` so the authored Russian casing is preserved;
- sections get `box-sizing: border-box; max-height: 100%; overflow: hidden`.

Fixes (`app/src/css/components.css` / `app/index.html`):
- the bulb stage got `min-width: 240px`, a smaller nowrap `rgb(...)` readout,
  and the slide-1 bulb column no longer forces a 160px box (which was wrapping
  `<div data-bulb-s1 style="width: 160px">`);
- inline sizes on slides 6 and 9 reduced (`1.8em → 1.4em`, `1.5em → 1.25em`);
- fixed `rgba(59, 123, 271, …)` → `rgba(59, 123, 255, …)` (invalid alpha channel).

### 15.3 Cup dragging was not smooth (T13)
The cups only reacted to a click (jump to the clicked level); dragging did not
produce a gradual change because the move handlers lived on `window` after
`setPointerCapture` and Reveal.js could claim the gesture.

Fix (`app/src/js/cup.js`):
- listeners are attached to the cup in the **capture phase** and call
  `preventDefault()`/`stopPropagation()` so Reveal.js never sees the gesture;
- dragging is now **relative**: the value changes by
  `(startY - clientY) / trackHeight * 255`, so the level tracks the pointer and
  never jumps; a tap shorter than 4px still sets the absolute clicked level;
- the mapping is extracted to the pure, unit-tested helper
  `dragValue(startValue, startY, currentY, trackHeight)` in `app/src/js/util.js`.

The protocol-aware hash helper is likewise extracted to `shouldUseHash(protocol)`
and covered by tests (closing the optional item from §8.3).

### 15.4 Challenge slide had no cups (T14)
`main.js` inserted the challenge cups **before** calling `createChallenge()`, but
`createChallenge()` replaces the mount point's `innerHTML`, deleting the cups.

Fix:
- `challenges.js` now renders a `.challenge-row` with a `.challenge-cups` slot
  next to the target preview;
- `main.js` calls `createChallenge()` first, then mounts the three cups into
  `.challenge-cups` and registers them for cleanup;
- `components.css` lays the row out horizontally so the slide still fits.

### 15.5 Verification performed
- `npm test` → **11 passed**.
- `npm run package` → `✓ web/index.html is self-contained (~1.4 MB)`.
- Headless Firefox screenshots at 1280×800 for slides 0–10 confirmed every slide
  fits, fonts render in Comfortaa/Nunito, and the challenge cups are present.
- `npm run build` still emits the multi-file `dist/`; `npm run dev` still serves
  from `app/`.
- `git status` shows no tracked `web/` or `dist/` output.
