import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const FILE_PATH = new URL('../web/index.html', import.meta.url);

async function verify() {
  if (!existsSync(FILE_PATH)) {
    console.error(`✗ web/index.html not found at ${FILE_PATH}`);
    process.exit(1);
  }

  const html = await readFile(FILE_PATH, 'utf8');
  const fail = (msg) => {
    console.error(`✗ ${msg}`);
    process.exit(1);
  };

  if (!/<html[^>]*\slang=["']ru["']/i.test(html)) fail('missing <html lang="ru">');
  if (/<script[^>]*\ssrc=/i.test(html))            fail('external <script src> found');
  if (/<link[^>]*\brel=["']?stylesheet/i.test(html)) fail('external stylesheet found');
  if (/sourceMappingURL/i.test(html))             fail('sourcemap reference found');
  if (!/data:font\//i.test(html))                 fail('no inlined fonts (base64) found');

  const urls = [...html.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map(m => m[0]);
  const unexpected = urls.filter(u => !u.startsWith('http://www.w3.org/2000/svg'));
  if (unexpected.length) fail(`external URLs found: ${unexpected.slice(0, 3).join(', ')}`);

  console.log(`✓ web/index.html is self-contained (${(html.length / 1024).toFixed(0)} KB)`);
}

verify().catch(err => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
