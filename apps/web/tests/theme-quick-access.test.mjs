import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const popover = readFileSync(new URL('../src/ThemeQuickAccess.tsx', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/AccountPages.tsx', import.meta.url), 'utf8');
const toggle = readFileSync(new URL('../src/ThemeToggle.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/theme-quick-access.css', import.meta.url), 'utf8');

test('Theme button is visible before guest/member condition and reuses existing theme preference', () => {
  assert.match(app, /<ThemeQuickAccess value=\{themePreference\} onChange=\{updateThemePreference\} path=\{path\}\/>/);
  assert.ok(app.indexOf('<ThemeQuickAccess') < app.indexOf('{demoUser ? <div className="profile-menu-wrap"'));
  assert.match(profile, /<ThemeToggle value=\{themePreference\} onChange=\{onThemeChange\}\/>/);
  assert.match(popover, /<ThemeToggle value=\{value\} onChange=\{selectTheme\}\/>/);
  assert.match(toggle, /aria-pressed=\{value === option.value\}/);
});

test('Quick-access popover can close by outside click, Escape, new selection and navigation', () => {
  assert.match(popover, /document\.addEventListener\('pointerdown', onPointerDown\)/);
  assert.match(popover, /!rootRef\.current\?\.contains\(event\.target\)/);
  assert.match(popover, /document\.removeEventListener\('pointerdown', onPointerDown\)/);
  assert.match(popover, /event\.key === 'Escape'/);
  assert.match(popover, /triggerRef\.current\?\.focus\(\)/);
  assert.match(popover, /useEffect\(\(\) => setOpen\(false\), \[path\]\)/);
  assert.match(popover, /onChange\(theme\);\s*setOpen\(false\)/);
  assert.match(popover, /aria-expanded=\{open\}/);
  assert.match(popover, /aria-controls=\{open \? popoverId : undefined\}/);
});

test('Quick-access is compact in desktop and mobile and respects reduced motion', () => {
  assert.match(styles, /\.theme-quick-trigger\{width:37px;height:37px/);
  assert.match(styles, /@media\(max-width:760px\)/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /var\(--color-paper\)/);
});
