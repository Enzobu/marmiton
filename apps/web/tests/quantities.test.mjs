import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BASE_SERVINGS, ingredientQuantities, formatQuantity, recipePath, recipes } from '../src/recipe-data.ts';

test('Ingredient amounts scale proportionally with servings', () => {
  const flour = ingredientQuantities[4].find(item => item.name === 'Farine');
  assert.ok(flour);
  assert.equal(formatQuantity(flour, BASE_SERVINGS), '250 g');
  assert.equal(formatQuantity(flour, 2), '125 g');
  assert.equal(formatQuantity(flour, 8), '500 g');
});

test('Fractional ingredients are represented without truncation', () => {
  const egg = ingredientQuantities[4].find(item => item.name === 'Œufs');
  assert.ok(egg);
  assert.equal(formatQuantity(egg, 3), '1,5');
});

test('Optional ingredient amounts are shown as to taste', () => {
  assert.equal(formatQuantity({ name: 'Sel', amount: null, icon: 'spice' }, 6), 'À votre goût');
});

test('All seeded recipes have navigable detail and ingredients', () => {
  for (const recipe of recipes) {
    assert.match(recipePath(recipe.id), /^\/recipes\/\d+$/);
    assert.ok(ingredientQuantities[recipe.id].length);
  }
});
