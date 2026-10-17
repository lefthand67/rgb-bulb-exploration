#!/usr/bin/env node
// Screenshot a specific slide: node scripts/shot.mjs <url> <out.png>
// Requires a running firefox headless with --remote-debugging-port 9222
// and an http-served copy of the deck.
import { writeFileSync } from 'node:fs';

const PAGE = process.argv[2];
const OUT = process.argv[3];
const W = parseInt(process.argv[4] ?? '1280', 10);
const H = parseInt(process.argv[5] ?? '800', 10);

const ws = new WebSocket('ws://127.0.0.1:9222/session');
let id = 0;
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};
setTimeout(() => { console.error('TIMEOUT'); ws.close(); process.exit(3); }, 45000);

let ctx;
try {
  await new Promise((r) => (ws.onopen = r));
  await send('session.new', { capabilities: {} });
  const tree = await send('browsingContext.getTree', {});
  ctx = tree?.contexts?.[0]?.context;
  await send('browsingContext.setViewport', {
    context: ctx, viewport: { width: W, height: H },
  });
  await send('browsingContext.navigate', { context: ctx, url: PAGE, wait: 'complete' });
  await new Promise((r) => setTimeout(r, 5000));
  const shot = await send('browsingContext.captureScreenshot', { context: ctx });
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('saved', OUT);
} finally {
  if (ctx) { try { await send('session.end', {}); } catch {} }
  ws.close();
  process.exit(0);
}