import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('builds the DailyFlo usage monitor for the active domain', async () => {
  const html = await readFile(new URL('dist/index.html', root), 'utf8');
  assert.match(html, /<html[^>]*lang=["']id["']/i);
  assert.match(html, /DailyFlo Usage Monitor/);
  assert.match(html, /Pemakaian model DailyFlo/);
  assert.match(html, /https:\/\/dailyflo\.me\/og\.png/);
});

test('shows only three sandboxed non-interactive usage crops', async () => {
  const html = await readFile(new URL('dist/index.html', root), 'utf8');
  assert.equal((html.match(/<iframe/g) || []).length, 3);
  assert.equal((html.match(/sandbox="allow-scripts allow-same-origin"/g) || []).length, 3);
  assert.doesNotMatch(html, /password-input|api\/auth\/login/);

  const css = await readFile(new URL('src/style.css', root), 'utf8');
  assert.match(css, /\.usage-crop iframe[\s\S]*pointer-events:\s*none/);
});

test('keeps the custom domain in the Pages artifact', async () => {
  const cname = await readFile(new URL('dist/CNAME', root), 'utf8');
  assert.equal(cname.trim(), 'dailyflo.me');
});
