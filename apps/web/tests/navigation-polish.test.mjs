import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const authStyles = readFileSync(new URL('../src/auth.css', import.meta.url), 'utf8');
const darkStyles = readFileSync(new URL('../src/dark.css', import.meta.url), 'utf8');

test('Profile menu closes for outside pointer and Escape, and cleans up listeners', () => {
  assert.match(main, /profileMenuRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(main, /profile-menu-wrap" ref=\{profileMenuRef\}/);
  assert.match(main, /!profileMenuRef\.current\?\.contains\(event\.target\)/);
  assert.match(main, /document\.addEventListener\('pointerdown', handleOutsidePointer\)/);
  assert.match(main, /document\.removeEventListener\('pointerdown', handleOutsidePointer\)/);
  assert.match(main, /event\.key === 'Escape'/);
  assert.match(main, /document\.removeEventListener\('keydown', handleEscape\)/);
  assert.match(main, /setProfileOpen\(false\);\s*setPath\(window\.location\.pathname\)/);
});

test('Main navigation highlights the active route in desktop and mobile menus', () => {
  assert.match(main, /path === '\/' \? 'home'/);
  assert.match(main, /path === '\/favorites' \? 'favorites'/);
  assert.match(main, /path === '\/recipes\/new'/);
  assert.match(main, /\^\\\/recipes\\\/\\d\+\\\/edit\$/);
  assert.match(main, /\^\\\/recipes\\\/\\d\+\$/);
  for (const id of ['home', 'recipes', 'favorites', 'create']) {
    const re = new RegExp(`activeNav === '${id}'`, 'g');
    assert.equal([...main.matchAll(re)].length, 4, `desktop and mobile active class and aria-current for ${id}`);
  }
  assert.match(styles, /desktop-navigation button\.nav-active/);
  assert.match(styles, /mobile-navigation button\.nav-active/);
  assert.match(darkStyles, /desktop-navigation button\.nav-active/);
  assert.match(darkStyles, /mobile-navigation button\.nav-active/);
});

test('Logout is distinguishable in red in both themes', () => {
  assert.match(main, /className="profile-logout"/);
  assert.match(authStyles, /profile-dropdown button\.profile-logout\{color:#b43c37/);
  assert.match(darkStyles, /profile-dropdown button\.profile-logout\{color:#ffaaa0/);
  assert.match(darkStyles, /profile-dropdown button\.profile-logout:focus-visible/);
});
