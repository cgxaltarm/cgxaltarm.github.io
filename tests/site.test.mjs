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

test('embeds the original usage dashboard without client-side credentials', async () => {
  const html = await readFile(new URL('dist/index.html', root), 'utf8');
  assert.match(html, /<iframe[^>]+src=["']https:\/\/api\.dailyflo\.me\/dashboard\/usage["']/i);
  assert.doesNotMatch(html, /password-input|api\/auth\/login|32311/);
});

test('keeps the custom domain in the Pages artifact', async () => {
  const cname = await readFile(new URL('dist/CNAME', root), 'utf8');
  assert.equal(cname.trim(), 'dailyflo.me');
});
