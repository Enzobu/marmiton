import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/AccountPages.tsx', import.meta.url), 'utf8');
const themeToggle = readFileSync(new URL('../src/ThemeToggle.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/dark.css', import.meta.url), 'utf8');

test('Brand uses uppercase L in header and footer', () => {
  assert.match(app, />Les petits<span className="logo-accent">plats\.<\/span>/);
  assert.match(app, /footer-brand">Les petits<span>plats\.<\/span>/);
});

test('Guests are redirected to login for every favorite entry point', () => {
  assert.match(app, /const toggleFavorite = \(id: number\) => \{\s*if \(!demoUser\) \{ navigate\('\/login'\); return; \}/);
  assert.match(app, /const openFavorites = \(\) => \{ setMenuOpen\(false\); if \(!demoUser\) \{ navigate\('\/login'\); return; \}/);
  assert.match(app, /if \(path === '\/favorites' && !demoUser\) navigate\('\/login'\)/);
  assert.match(app, /accountRoute !== 'favorites' \|\| demoUser/);
  assert.match(app, /setDemoUser\(null\); setFavorites\(\[\]\)/);
  assert.match(app, /onToggle=\{toggleFavorite\}/);
  assert.match(app, /toggleFavorite=\{toggleFavorite\}/);
});

test('Theme control is a compact accessible sun-system-moon slider', () => {
  assert.match(profile, /<ThemeToggle value=\{themePreference\} onChange=\{onThemeChange\}/);
  const ordered = ['light', 'system', 'dark'].map(value => themeToggle.indexOf(`value: '${value}'`));
  assert.ok(ordered.every(position => position >= 0));
  assert.ok(ordered[0] < ordered[1] && ordered[1] < ordered[2]);
  assert.match(themeToggle, /aria-pressed=\{value === option.value\}/);
  assert.match(themeToggle, /aria-label=\{option.label\}/);
  assert.match(css, /data-selected="system"/);
  assert.match(css, /data-selected="dark"/);
  assert.match(css, /account-theme-segments::before/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('Dark form surfaces are consistent in home, catalog and editors', () => {
  assert.match(css, /\.hero-search input,\s*\.catalog-search input\{background:transparent/);
  assert.match(css, /html\[data-theme="dark"\] :is\(\.hero-search input,\.catalog-search input\)\{background:transparent/);
  for (const field of ['.auth-input-wrap input', '.account-search input', '.account-form-grid input', '.advanced-search-panel select', '.form-field input', '.recipe-json-panel textarea']) {
    assert.ok(css.includes(field), field);
  }
});
