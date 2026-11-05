import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { RECIPE_JSON_EXAMPLE, parseRecipeJson, recipeJsonFilename, stringifyRecipeJson, validateRecipeJson } from '../src/recipe-json.ts';

const modal = readFileSync(new URL('../src/RecipeJsonModal.tsx', import.meta.url), 'utf8');
const editor = readFileSync(new URL('../src/RecipePages.tsx', import.meta.url), 'utf8');
const account = readFileSync(new URL('../src/AccountPages.tsx', import.meta.url), 'utf8');
const root = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');

test('Document example passes schema v1 validation and round-trips', () => {
  const result = parseRecipeJson(stringifyRecipeJson(RECIPE_JSON_EXAMPLE));
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, RECIPE_JSON_EXAMPLE);
});
test('Reject unsupported schema versions and external identifiers', () => {
  assert.equal(validateRecipeJson({ ...RECIPE_JSON_EXAMPLE, schemaVersion: 2 }).ok, false);
  assert.equal(validateRecipeJson({ ...RECIPE_JSON_EXAMPLE, id: '123' }).ok, false);
  assert.equal(validateRecipeJson({ ...RECIPE_JSON_EXAMPLE, uuid: '123' }).ok, false);
});
test('Reject malformed JSON and invalid quantities without partial import', () => {
  assert.equal(parseRecipeJson('{').ok, false);
  assert.equal(validateRecipeJson({ ...RECIPE_JSON_EXAMPLE, servings: 0 }).ok, false);
  assert.equal(validateRecipeJson({ ...RECIPE_JSON_EXAMPLE, ingredients: [{ name: 'Farine', quantity: -5, unit: 'g' }] }).ok, false);
  assert.equal(validateRecipeJson({ ...RECIPE_JSON_EXAMPLE, steps: [] }).ok, false);
});
test('Generate safe normalized lowercase filenames', () => {
  assert.equal(recipeJsonFilename('Crème brûlée à la vanille'), 'creme_brulee_a_la_vanille.json');
  assert.equal(recipeJsonFilename('Lasagnes maison'), 'lasagnes_maison.json');
  assert.equal(recipeJsonFilename('../../'), 'recette.json');
  assert.equal(recipeJsonFilename('Poulet rôti aux herbes'), 'poulet_roti_aux_herbes.json');
});
test('UI exposes import-export actions and remembers developer switch', () => {
  assert.match(modal, /Charger l'exemple/);
  assert.match(modal, /Copier l'exemple/);
  assert.match(modal, /setExampleLoaded\(false\)/);
  assert.match(modal, /Copier<\/button>/);
  assert.match(modal, /Télécharger<\/button>/);
  assert.match(modal, /recipeJsonFilename\(recipe.title\)/);
  assert.match(modal, /onImport\(result.value\)/);
  assert.match(editor, /setTitle\(document.title\)/);
  assert.match(account, /Mode développeur/);
  assert.match(root, /localStorage\.setItem\('petitsplats.developerMode'/);
});
