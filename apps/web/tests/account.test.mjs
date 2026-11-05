import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const account = readFileSync(new URL('../src/AccountPages.tsx', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../src/AuthPages.tsx', import.meta.url), 'utf8');
const recipePages = readFileSync(new URL('../src/RecipePages.tsx', import.meta.url), 'utf8');
const recipeData = readFileSync(new URL('../src/recipe-data.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/account.css', import.meta.url), 'utf8');

test('All navigable frontend paths use English segments', () => {
  for (const path of ['/profile', '/my-recipes', '/favorites', '/recipes', '/recipes/new', '/login', '/register', '/forgot-password', '/verify-email', '/reset-password']) {
    assert.ok([app, auth, account, recipePages, recipeData].some(source => source.includes(path)), path);
  }
  for (const legacy of ['/recettes', '/connexion', '/inscription', '/mot-de-passe-oublie', '/verification-email', '/reinitialiser-mot-de-passe']) {
    for (const source of [app, auth, account, recipePages, recipeData]) assert.ok(!source.includes(legacy), legacy);
  }
});

test('Account pages provide editable profile and custom photo in demo', () => {
  assert.match(account, /onProfileChange/);
  assert.match(account, /type="file"/);
  assert.match(account, /image\/jpeg/);
  assert.match(account, /2_000_000/);
  assert.match(account, /onPhoto/);
  assert.match(account, /account-preferences/);
});

test('Favorites and personal recipe controls have working callbacks', () => {
  assert.match(account, /onFavoriteToggle\(recipe.id\)/);
  assert.match(account, /onDeleteRecipe\(recipe.id\)/);
  assert.match(account, /sort === 'name'/);
  assert.match(account, /EmptyContent/);
  assert.match(app, /setCreatedRecipes\(current => \[recipe, \.\.\.current.filter/);
});

test('Recipe edit route reuses the creation form with initial data', () => {
  assert.match(app, /editRecipe && <RecipeCreate/);
  assert.match(recipePages, /initialRecipe\?: Recipe/);
  assert.match(recipePages, /initialRecipe\?\.id \?\? Date.now\(\)/);
});

test('Account UI is responsive and uses existing light tokens', () => {
  assert.match(css, /var\(--color-accent\)/);
  assert.match(css, /var\(--color-paper\)/);
  assert.match(css, /@media\(max-width:760px\)/);
});
