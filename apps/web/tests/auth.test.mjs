import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../src/AuthPages.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/auth.css', import.meta.url), 'utf8');

test('Authentication has dedicated deep links', () => {
  for (const route of ['/login', '/forgot-password', '/reset-password']) {
    assert.ok(auth.includes(route), route);
  }
  assert.match(main, /authPage && <AuthPage/);
  assert.match(main, /!selectedRecipe && !authPage/);
});

test('Login uses the API and restores the session on reload', () => {
  assert.match(auth, /'\/auth\/login'/);
  assert.match(auth, /'\/auth\/reset-password'/);
  assert.match(main, /apiRequest<Profile>\('\/auth\/me'/);
  assert.match(main, /saveSession\(token, remember\)/);
});

test('Login and password recovery offer accessible forms', () => {
  assert.match(auth, /type="email"/);
  assert.match(auth, /autoComplete="new-password"/);
  assert.match(auth, /aria-pressed=\{show\}/);
  assert.match(auth, /role=\{feedbackType === 'error' \? 'alert' : 'status'\}/);
  assert.match(auth, /passwordChecks/);
});

test('Auth visual theme follows existing tokens with mobile layout', () => {
  assert.match(css, /var\(--color-accent\)/);
  assert.match(css, /var\(--color-paper\)/);
  assert.match(css, /@media\(max-width:760px\)/);
});
