import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/AccountPages.tsx', import.meta.url), 'utf8');
const toggle = readFileSync(new URL('../src/ThemeToggle.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/dark.css', import.meta.url), 'utf8');

test('Theme applies before app mount to prevent light flash', () => {
  assert.match(html, /localStorage\.getItem\('petitsplats.theme'\)/);
  assert.ok(html.indexOf("setAttribute('data-theme'") < html.indexOf('src="/src/main.tsx"'));
});
test('Theme settings support light, dark and system preference', () => {
  assert.match(profile, /<ThemeToggle value=\{themePreference\} onChange=\{onThemeChange\}\/>/);
  assert.match(toggle, /value: 'light', label: 'Clair'/);
  assert.match(toggle, /value: 'system', label: 'Système'/);
  assert.match(toggle, /value: 'dark', label: 'Sombre'/);
  assert.match(app, /localStorage\.setItem\('petitsplats.theme'/);
  assert.match(app, /matchMedia\('\(prefers-color-scheme: dark\)'\)/);
  assert.match(app, /media\.addEventListener\('change', apply\)/);
  assert.match(app, /media\.removeEventListener\('change', apply\)/);
});
test('Dark tokens and UI coverage include all key pages', () => {
  assert.match(styles, /:root\[data-theme="dark"\]/);
  for (const selector of ['.site-header','.category-tile','.ingredients-panel','.create-card','.account-main','.auth-layout','.recipe-json-modal','.advanced-search-panel']) {
    assert.ok(styles.includes(selector), selector);
  }
  assert.match(styles, /color-scheme:dark/);
  assert.match(styles, /prefers-reduced-motion/);
});
