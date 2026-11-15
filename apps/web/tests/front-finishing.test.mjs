import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/dark.css', import.meta.url), 'utf8');

test('Brand uses uppercase L in header and footer', () => {
  assert.match(app, />Les petits<span className="logo-accent">plats\.<\/span>/);
  assert.match(app, /footer-brand">Les petits<span>plats\.<\/span>/);
});

test('Guests are redirected to login for every favorite entry point', () => {
  assert.match(app, /const toggleFavorite = \(id: [^)]*\) => \{\s*if \(!profile\) \{ navigate\('\/login'\); return; \}/);
  assert.match(app, /const openFavorites = \(\) => \{ setMenuOpen\(false\); if \(!profile\) \{ navigate\('\/login'\); return; \}/);
  assert.match(app, /'\/favorites', '\/profile', '\/my-recipes', '\/recipes\/new'/);
  assert.match(app, /accountRoute && profile/);
  assert.match(app, /saveSession\(null\)/);
  assert.match(app, /onToggle=\{toggleFavorite\}/);
  assert.match(app, /toggleFavorite=\{toggleFavorite\}/);
});

test('Dark form surfaces are consistent in home, catalog and editors', () => {
  assert.match(css, /\.hero-search input,\s*\.catalog-search input\{background:transparent/);
  assert.match(css, /html\[data-theme="dark"\] :is\(\.hero-search input,\.catalog-search input\)\{background:transparent/);
  for (const field of ['.auth-input-wrap input', '.account-search input', '.account-form-grid input', '.advanced-search-panel select', '.form-field input', '.recipe-json-panel textarea']) {
    assert.ok(css.includes(field), field);
  }
});
