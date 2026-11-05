import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../src/AuthPages.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/auth.css', import.meta.url), 'utf8');

test('Authentication has dedicated deep links', () => {
  for (const route of ['/connexion', '/inscription', '/mot-de-passe-oublie', '/verification-email', '/reinitialiser-mot-de-passe']) {
    assert.ok(auth.includes(route), route);
  }
  assert.match(main, /authPage && <AuthPage/);
  assert.match(main, /!selectedRecipe && !authPage/);
});

test('Mock login is explicit, not a real authenticated session', () => {
  assert.match(auth, /compte de démonstration/);
  assert.match(auth, /Aucun compte n’a été créé/);
  assert.match(auth, /aucun e-mail n’a été envoyé/i);
  assert.match(main, /setDemoUser/);
  assert.doesNotMatch(main, /localStorage|sessionStorage/);
});

test('Registration and password recovery offer accessible forms', () => {
  assert.match(auth, /type="email"/);
  assert.match(auth, /autoComplete="given-name"/);
  assert.match(auth, /autoComplete="family-name"/);
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
