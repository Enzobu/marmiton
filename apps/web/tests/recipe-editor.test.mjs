import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const editor = readFileSync(new URL('../src/RecipePages.tsx', import.meta.url), 'utf8');
const draft = readFileSync(new URL('../src/recipe-draft.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');

test('Recipe editor supports local photo selection and validation', () => {
  assert.match(editor, /type="file"/);
  assert.match(editor, /validateRecipeImage\(file\)/);
  assert.match(draft, /2_000_000/);
  assert.match(draft, /image\/webp/);
});
test('Drafts can be saved, resumed and cleared', () => {
  assert.match(draft, /localStorage\.setItem/);
  assert.match(draft, /localStorage\.getItem/);
  assert.match(draft, /localStorage\.removeItem/);
  assert.match(editor, /restoreDraft/);
  assert.match(editor, /if \(initialRecipe \|\| savedDraft\) return/);
});
test('Extra metadata is persisted in the in-memory recipe record', () => {
  assert.match(editor, /setRest/);
  assert.match(editor, /setBudget/);
  assert.match(editor, /setUtensils/);
  assert.match(editor, /servings \};/);
  assert.match(app, /recipePreparation\[recipe.id\] = \{ prep, cook, \.\.\.metadata \}/);
});
