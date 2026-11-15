import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BASE_SERVINGS, ingredientQuantities, formatQuantity, formatTime, recipePath, recipes } from '../src/recipe-data.ts';

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

test('Recipe durations use compact hours and zero-padded minutes', () => {
  assert.equal(formatTime(0), '0 min');
  assert.equal(formatTime(59), '59 min');
  assert.equal(formatTime(60), '1h');
  assert.equal(formatTime(137), '2h17');
  assert.equal(formatTime(965), '16h05');
});
