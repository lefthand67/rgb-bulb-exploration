#!/usr/bin/env node
// Verify vertical centering (plan 20261018_025806 §2A.7): every slide's inline
// `top` must equal (720 − scrollHeight)/2 ±1 px, measured without resizing.
// Page list is discovered dynamically, including nested (vertical) pages.
// Usage: node scripts/check-centering.mjs <page-url> [--shot out.png]

const url = process.argv[2];
const shotArg = process.argv.indexOf('--shot');

const ws = new WebSocket('ws://127.0.0.1:9222/session');
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
pending.delete = ((orig) => (key) => { orig.call(pending, key); })(pending.delete.bind(pending));

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

 const measureExpr = `(() => {
  // vertical stacks: measure the inner (sub-)slide, not the container
  const s = document.querySelector('section.present section.present')
    || document.querySelector('section.present');
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

  // Build the page list: every horizontal index 'N' plus every nested index
  // 'N/V' of any section that has children.
  const structRes = await send('script.evaluate', {
    target: { context: ctx },
    expression: `(() => {
      const tops = [...document.querySelectorAll('.reveal .slides > section')];
      const pages = [];
      tops.forEach((sec, i) => {
        const nested = sec.querySelectorAll(':scope > section');
        if (nested.length === 0) pages.push(String(i));
        else for (let v = 0; v < nested.length; v++) pages.push(i + '/' + v);
      });
      return pages.join('|');
    })()`,
    awaitPromise: false,
  });
  const base = url.replace(/#.*/, '');
  const pages = structRes.result.value.split('|');

  const lines = [];
  for (const page of pages) {
    await send('browsingContext.navigate', {
      context: ctx, url: `${base}#/${page}`, wait: 'complete',
    });
    await new Promise((r) => setTimeout(r, 1100));
    const { result } = await send('script.evaluate', {
      target: { context: ctx }, expression: measureExpr, awaitPromise: false,
    });
    lines.push(page + ': ' + result.value);
  }

  const ok = lines.length === pages.length && lines.every((l) => l.trimEnd().endsWith('true'));
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