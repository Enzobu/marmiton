import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const feedback = readFileSync(new URL('../src/UiFeedback.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const account = readFileSync(new URL('../src/AccountPages.tsx', import.meta.url), 'utf8');
const editor = readFileSync(new URL('../src/RecipePages.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui-feedback.css', import.meta.url), 'utf8');

test('Destructive actions use accessible confirmation dialogs', () => {
  assert.match(feedback, /role="alertdialog"/);
  assert.match(feedback, /aria-modal="true"/);
  assert.match(feedback, /onKeyDown/);
  assert.match(feedback, /previouslyFocused\?\.focus\(\)/);
  assert.doesNotMatch(account, /window\.confirm/);
  assert.doesNotMatch(editor, /window\.confirm/);
  assert.match(account, /setPendingDelete\(recipe\)/);
  assert.match(editor, /applyImportedRecipe/);
});
test('UX feedback reports demo actions without misleading API success', () => {
  assert.match(app, /notify\('Recette de démonstration enregistrée.'/);
  assert.match(app, /'Recette ajoutée aux favoris.'/);
  assert.match(app, /notify\(alreadySaved/);
  assert.match(app, /<ToastRegion toast=\{toast\}/);
  assert.match(feedback, /role=\{toast.type === 'error' \? 'alert' : 'status'\}/);
});
test('Real image loading uses skeleton state and motion preferences', () => {
  assert.match(app, /const \[imageReady, setImageReady\]/);
  assert.match(app, /onLoad=\{\(\) => setImageReady\(true\)\}/);
  assert.match(css, /recipe-image-button:not\(\.image-ready\)::before/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
test('Dedicated not found page has helpful navigation', () => {
  assert.match(app, /isNotFound && <NotFoundPage/);
  assert.match(feedback, /La recette s'est échappée/);
  assert.match(feedback, /navigate\('\/recipes'\)/);
});
