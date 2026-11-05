import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const pages = readFileSync(new URL('../src/RecipePages.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

test('HTML mounts React', () => {
  assert.match(html, /id="root"/);
  assert.match(html, /src="\/src\/main.tsx"/);
});

test('Home and catalog keep interactive search and favorites', () => {
  assert.match(app, /setSearch/);
  assert.match(app, /toggleFavorite/);
  assert.match(app, /isCatalog/);
});

test('Recipe detail is a true route rather than a popup', () => {
  assert.match(app, /selectedRecipe && <RecipeDetail/);
  assert.doesNotMatch(app, /modal-backdrop/);
  assert.match(pages, /servings-stepper/);
  assert.match(pages, /formatQuantity/);
  assert.match(pages, /ingredient-list/);
  assert.match(pages, /step-list/);
});

test('Recipe creation exposes repeatable ingredient and preparation fields', () => {
  assert.match(pages, /addIngredient/);
  assert.match(pages, /addStep/);
  assert.match(pages, /type="submit"/);
});

test('Design tokens enable later theme overrides', () => {
  assert.match(css, /--color-page:/);
  assert.match(css, /--color-paper:/);
  assert.match(css, /--color-ink:/);
  assert.match(css, /prefers-reduced-motion/);
});
