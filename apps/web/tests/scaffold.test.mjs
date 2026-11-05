import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

test('HTML mounts React', () => {
  assert.match(html, /id="root"/);
  assert.match(html, /src="\/src\/main.tsx"/);
});
test('Recipe interface includes interactive search and favorite state', () => {
  assert.match(app, /setSearch/);
  assert.match(app, /toggleFavorite/);
  assert.match(app, /role="dialog"/);
});
test('Design tokens enable later theme overrides', () => {
  assert.match(css, /--color-page:/);
  assert.match(css, /--color-paper:/);
  assert.match(css, /--color-ink:/);
  assert.match(css, /prefers-reduced-motion/);
});
