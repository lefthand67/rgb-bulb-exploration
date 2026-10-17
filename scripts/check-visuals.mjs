#!/usr/bin/env node
// Visual contract for the RGB deck (plan 20261018_040921 §4).
// Usage:
//   1. npm run dev          (serves http://localhost:3000)
//   2. firefox --headless --remote-debugging-port 9222 about:blank
//   3. npm run check:visuals
//
// Checks: a permanently dark additive-light stage with pure RGB circles,
// the genuinely unlit bulb (off/dim/on), the cube collapsing to one sheet at
// blue 0, and the expanded challenge data. It waits for slide/opacity
// transitions before reading computed styles so it is not flaky.

const url = process.argv[2] ?? 'http://localhost:3000';
const base = url.replace(/#.*/, '');

const ws = new WebSocket('ws://127.0.0.1:9222/session');
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};

setTimeout(() => {
  console.error('TIMEOUT: BiDi did not finish in 150s');
  try { ws.close(); } catch {}
  process.exit(3);
}, 150000);

let ctx;
const failures = [];
const results = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function unpack(value) {
  if (!value || typeof value !== 'object' || !('type' in value)) return value;
  switch (value.type) {
    case 'string':
    case 'number':
    case 'boolean':
      return value.value;
    case 'null':
    case 'undefined':
      return null;
    case 'array':
      return value.value.map(unpack);
    case 'object':
      return Object.fromEntries(value.value.map(([key, val]) => [key, unpack(val)]));
    default:
      return value.value;
  }
}

async function evaluate(expression) {
  const { result } = await send('script.evaluate', {
    target: { context: ctx },
    expression,
    awaitPromise: false
  });
  return unpack(result);
}

async function go(page, settle = 1300) {
  await send('browsingContext.navigate', {
    context: ctx,
    url: `${base}#/${page}`,
    wait: 'complete'
  });
  await wait(settle);
}

function check(name, condition, detail = '') {
  const ok = Boolean(condition);
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

const rgbNumbers = (css) => {
  const m = String(css).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  return m[1].split(',').slice(0, 3).map((v) => parseFloat(v));
};

try {
  await new Promise((r) => (ws.onopen = r));
  await send('session.new', { capabilities: {} });
  const tree = await send('browsingContext.getTree', {});
  ctx = tree?.contexts?.[0]?.context;
  if (!ctx) throw new Error('no context: ' + JSON.stringify(tree).slice(0, 300));

  // --- Light mixing (slide 3, myth 2) -------------------------------------
  for (const page of ['2', '8/1']) {
    await go(page);
    const stage = await evaluate(`(() => {
      const stage = document.querySelector('.present .lightmix-stage');
      if (!stage) return null;
      const cs = getComputedStyle(stage);
      const circle = (color) => {
        const el = stage.querySelector('.lightmix-circle.' + color);
        if (!el) return null;
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, blend: s.mixBlendMode };
      };
      return {
        bg: cs.backgroundColor,
        isolated: cs.isolation,
        red: circle('red'), green: circle('green'), blue: circle('blue')
      };
    })()`);
    check(`#/${page} lightmix stage exists`, stage, JSON.stringify(stage));
    if (!stage) continue;

    const stageRgb = rgbNumbers(stage.bg);
    check(`#/${page} lightmix stage is dark`,
      stageRgb && stageRgb.every((v) => v < 60), stage.bg);
    check(`#/${page} lightmix stage isolates blending`,
      stage.isolated === 'isolate', stage.isolated);
    check(`#/${page} red circle is pure red`,
      stage.red?.bg === 'rgb(255, 0, 0)' && stage.red?.blend === 'screen',
      JSON.stringify(stage.red));
    check(`#/${page} green circle is pure green`,
      stage.green?.bg === 'rgb(0, 255, 0)' && stage.green?.blend === 'screen',
      JSON.stringify(stage.green));
    check(`#/${page} blue circle is pure blue`,
      stage.blue?.bg === 'rgb(0, 0, 255)' && stage.blue?.blend === 'screen',
      JSON.stringify(stage.blue));
  }

  // --- Bulb off/dim/on (slide 4) ------------------------------------------
  await go('3');
  const bulbStateExpr = `(() => {
    const svg = document.querySelector('.present .bulb-container svg');
    if (!svg) return null;
    const emissive = svg.querySelector('.bulb-emissive');
    const glass = svg.querySelector('.bulb-glass');
    return {
      state: svg.dataset.bulbState,
      opacity: getComputedStyle(emissive).opacity,
      fill: getComputedStyle(glass).fill
    };
  })()`;

  let bulb = await evaluate(bulbStateExpr);
  const offFill = rgbNumbers(bulb?.fill);
  check('#/3 starts with an unlit bulb', bulb?.state === 'off', JSON.stringify(bulb));
  check('#/3 off emissive layer is fully transparent', bulb?.opacity === '0', bulb?.opacity);
  check('#/3 unlit glass is dark, not white/transparent',
    offFill && offFill.every((v) => v < 120), bulb?.fill);

  await evaluate(`document.querySelector('.present .light-switch').click()`);
  await wait(350);
  bulb = await evaluate(bulbStateExpr);
  check('#/3 switch turns the bulb on', bulb?.state === 'on', JSON.stringify(bulb));
  check('#/3 on emissive layer is bright', parseFloat(bulb?.opacity) > 0.9, bulb?.opacity);

  await evaluate(`document.querySelector('.present .light-switch').click()`);
  await wait(350);
  bulb = await evaluate(bulbStateExpr);
  check('#/3 switch turns the bulb off again', bulb?.state === 'off', JSON.stringify(bulb));

  // --- Playground Night preset and a dim colour (slide 5) -----------------
  await go('4');
  await evaluate(`document.querySelector('.present [data-preset="0,0,0"]').click()`);
  await wait(350);
  bulb = await evaluate(bulbStateExpr);
  check('#/4 Night preset gives an unlit bulb', bulb?.state === 'off', JSON.stringify(bulb));

  await evaluate(`(() => {
    const setCup = (channel, value) => {
      const input = document.querySelector('.present [data-channel="' + channel + '"] .sr-only-input');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setCup('r', 10); setCup('g', 20); setCup('b', 50);
  })()`);
  await wait(350);
  bulb = await evaluate(bulbStateExpr);
  check('#/4 dark blue is dim, not off/white', bulb?.state === 'dim', JSON.stringify(bulb));
  check('#/4 dim emissive layer glows faintly',
    parseFloat(bulb?.opacity) > 0 && parseFloat(bulb?.opacity) < 0.9, bulb?.opacity);

  // --- Cube collapse (slide 8) --------------------------------------------
  await go('7');
  const cubeExpr = `(() => {
    const canvas = document.querySelector('.present .cube-iso__canvas');
    const caption = document.querySelector('.present .cube-iso__caption');
    return { count: canvas?.dataset.sheetCount, blue: canvas?.dataset.blue, caption: caption?.textContent ?? '' };
  })()`;

  await evaluate(`(() => {
    const input = document.querySelector('.present #cubeBlue');
    input.value = 0;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await wait(250);
  let cube = await evaluate(cubeExpr);
  check('#/7 blue 0 collapses the cube to one sheet', cube?.count === '1', JSON.stringify(cube));
  check('#/7 blue 0 reports blue=0', cube?.blue === '0', cube?.blue);
  check('#/7 blue 0 caption explains the square',
    cube?.caption?.includes('65 536'), cube?.caption);

  await evaluate(`(() => {
    const input = document.querySelector('.present #cubeBlue');
    input.value = 255;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await wait(250);
  cube = await evaluate(cubeExpr);
  check('#/7 blue 255 grows the full cube', Number(cube?.count) > 1, JSON.stringify(cube));
  check('#/7 blue 255 caption explains the cube',
    cube?.caption?.includes('16 777 216'), cube?.caption);

  // --- Expanded challenge (slide 12) --------------------------------------
  await go('9');
  const challenge = await evaluate(`(() => {
    const mount = document.querySelector('.present #challenge-game');
    const pill = mount?.querySelector('.challenge-side .cup-value-pill');
    const total = mount?.querySelector('.challenge-total');
    return {
      targetCount: Number(mount?.dataset.targetCount),
      solvedCount: Number(mount?.dataset.solvedCount),
      pill: pill?.textContent.replace(/\\s+/g, ' ').trim() ?? '',
      total: total?.textContent.replace(/\\s+/g, ' ').trim() ?? ''
    };
  })()`);
  check('#/9 has at least 15 targets', challenge?.targetCount >= 15,
    JSON.stringify(challenge));
  check('#/9 starts with zero solved targets', challenge?.solvedCount === 0,
    String(challenge?.solvedCount));
  check('#/9 progress uses the target count, not 16 million',
    challenge?.pill?.includes(`из ${challenge.targetCount}`) &&
    !challenge.pill.includes('16 777 216'), challenge?.pill);
  check('#/9 keeps the 16-million fact as a separate line',
    challenge?.total?.includes('16 777 216'), challenge?.total);

  // --- Challenge layout and failed-guess retry ---------------------------
  const layoutExpr = `(() => {
    const section = document.querySelector('section.present');
    const box = document.querySelector('.present .challenge-box');
    const inView = (sel) => {
      const el = document.querySelector('.present ' + sel);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top >= 0 &&
        r.bottom <= window.innerHeight + 1;
    };
    return {
      scrollHeight: section?.scrollHeight ?? 0,
      boxBottom: box?.getBoundingClientRect().bottom ?? 0,
      viewportHeight: window.innerHeight,
      title: inView('.challenge-title'),
      target: inView('.target-preview'),
      check: inView('.btn-check'),
      skip: inView('.btn-skip')
    };
  })()`;

  let layout = await evaluate(layoutExpr);
  check('#/9 challenge fits inside a 720 px slide',
    layout && layout.scrollHeight <= 720 &&
    layout.boxBottom <= layout.viewportHeight + 1,
    JSON.stringify(layout));
  check('#/9 task, target and both actions are visible before guessing',
    layout?.title && layout?.target && layout?.check && layout?.skip,
    JSON.stringify(layout));

  const titleBefore = await evaluate(
    `document.querySelector('.present .challenge-title').textContent`);
  await evaluate(`document.querySelector('.present .btn-check').click()`);
  await wait(400);
  const failState = await evaluate(`(() => {
    const mount = document.querySelector('.present #challenge-game');
    return {
      title: document.querySelector('.present .challenge-title').textContent,
      status: document.querySelector('.present .challenge-status').textContent,
      solvedCount: Number(mount.dataset.solvedCount)
    };
  })()`);
  layout = await evaluate(layoutExpr);
  check('#/9 a failed guess keeps the same target (no auto-advance)',
    failState?.title === titleBefore, JSON.stringify(failState));
  check('#/9 a failed guess shows a retry hint',
    failState?.status?.includes('Пока не совпало') &&
    failState?.status?.includes('Подсказка'), failState?.status);
  check('#/9 a failed guess does not increase the solved count',
    failState?.solvedCount === 0, String(failState?.solvedCount));
  check('#/9 a failed guess still fits and keeps task/actions visible',
    layout && layout.scrollHeight <= 720 &&
    layout.boxBottom <= layout.viewportHeight + 1 &&
    layout.title && layout.target && layout.check && layout.skip,
    JSON.stringify(layout));

  await evaluate(`document.querySelector('.present .btn-skip').click()`);
  await wait(250);
  const titleAfterSkip = await evaluate(
    `document.querySelector('.present .challenge-title').textContent`);
  check('#/9 skip moves to the next target from a failed guess',
    titleAfterSkip && titleAfterSkip !== titleBefore, titleAfterSkip);
} catch (err) {
  console.error(err);
  failures.push('script error');
} finally {
  console.log(failures.length ? 'FAIL' : 'PASS');
  console.log(results.join('\n'));
  if (ctx) { try { await send('session.end', {}); } catch {} }
  ws.close();
  process.exit(failures.length ? 1 : 0);
}
