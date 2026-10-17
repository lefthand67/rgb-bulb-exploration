#!/usr/bin/env node
// Verify vertical centering (plan 20261018_025806 §2A.7) via WebDriver BiDi.
// Checks every slide: inline `top` must equal (720 − scrollHeight)/2 ±1 px.
// Usage: node scripts/check-centering.mjs <page-url> [--shot out.png]
// The deck does not expose Reveal, and synthesized keys do not navigate it, so
// each slide is measured by loading it directly through its `#/N` URL hash
// (requires the page to be served over http, e.g. `python3 -m http.server`).

const url = process.argv[2];
const shotArg = process.argv.indexOf('--shot');
const waitMs = 1200;

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

// Watchdog: abort cleanly. Never let `timeout` SIGKILL this process with an
// open socket — headless Firefox crashes when the BiDi connection dies mid-call.
setTimeout(() => {
  console.error('TIMEOUT: BiDi did not finish in 90s');
  try { ws.close(); } catch {}
  process.exit(3);
}, 90000);

const measureExpr = `(() => {
  const s = document.querySelector('.present');
  if (!s) return 'NO PRESENT';
  const top = parseFloat(s.style.top) || 0;
  const exp = Math.max((720 - s.scrollHeight) / 2, 0);
  return top.toFixed(1) + ':' + exp.toFixed(1) + ':' + s.scrollHeight
    + ':' + (Math.abs(top - exp) <= 1.5);
})()`;

let ctx;
try {
  await new Promise((r) => (ws.onopen = r));
  await send('session.new', { capabilities: {} });
  const tree = await send('browsingContext.getTree', {});
  ctx = tree?.contexts?.[0]?.context;
  if (!ctx) throw new Error('no context: ' + JSON.stringify(tree).slice(0, 300));

  await send('browsingContext.navigate', { context: ctx, url, wait: 'complete' });
  await new Promise((r) => setTimeout(r, 3000));

  // Discover how many slides the deck has.
  const countRes = await send('script.evaluate', {
    target: { context: ctx },
    expression: "document.querySelectorAll('.reveal .slides > section').length",
    awaitPromise: false,
  });
  const count = parseInt(countRes.result.value, 10);

  const base = url.replace(/#.*/, '');
  const lines = [];
  for (let i = 0; i < count; i++) {
    await send('browsingContext.navigate', {
      context: ctx, url: `${base}#/${i}`, wait: 'complete',
    });
    await new Promise((r) => setTimeout(r, waitMs));
    const { result } = await send('script.evaluate', {
      target: { context: ctx }, expression: measureExpr, awaitPromise: false,
    });
    lines.push(i + ': ' + result.value);
  }

  const ok = lines.every((l) => l.trimEnd().endsWith('true'));
  console.log(ok ? 'PASS' : 'FAIL');
  console.log(lines.join('\n'));

  if (shotArg > -1) {
    const { data } = await send('browsingContext.captureScreenshot', { context: ctx });
    const { writeFileSync } = await import('node:fs');
    writeFileSync(process.argv[shotArg + 1], Buffer.from(data, 'base64'));
  }
} finally {
  if (ctx) {
    try { await send('session.end', {}); } catch {}
  }
  ws.close();
  process.exit(0);
}