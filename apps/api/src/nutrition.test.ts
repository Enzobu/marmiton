import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nutritionOverrideSchema, summarizeNutrition } from './nutrition.js';
import { ingredientWeight } from './nutrition-weight.js';

const flour = { kcal: 350, protein: 10, carbs: 70, fat: 2 };

test('Nutrition converts mass units, estimates edible egg weight and allows a weight correction', () => {
  assert.equal(ingredientWeight('Farine', 0.25, 'kg'), 250);
  assert.equal(ingredientWeight('Farine', 250, 'mg'), 0.25);
  assert.equal(ingredientWeight('Œufs', 2, 'pièce(s)'), 100);
  assert.equal(ingredientWeight('Œufs', 2, 'pièce(s)', 114), 114);
  assert.equal(ingredientWeight('Huile d’olive', 1, 'c. à soupe'), null);
  assert.equal(ingredientWeight('Farine', null, 'g'), null);
});

test('Nutrition calculates per portion and reports unknown foods, weights and nutrient values', () => {
  const summary = summarizeNutrition([
    { name: 'Farine', grams: 200, macros: flour },
    { name: 'Produit maison', grams: 25, macros: null },
    { name: 'Épices', grams: null, macros: flour },
    { name: 'Ingrédient sans composition complète', grams: 100, macros: { kcal: null, protein: 1, carbs: null, fat: 0 } },
  ], 2);
  assert.deepEqual(summary.total, { kcal: 700, protein: 21, carbs: 140, fat: 4 });
  assert.deepEqual(summary.perPortion, { kcal: 350, protein: 10.5, carbs: 70, fat: 2 });
  assert.deepEqual(summary.missing.map(row => row.reason), ['food', 'weight', 'values']);
  const unknown = summarizeNutrition([{ name: 'Inconnu', grams: 100, macros: null }], 1);
  assert.deepEqual(unknown.perPortion, { kcal: null, protein: null, carbs: null, fat: null });
});

test('Nutrition corrections validate manual values and their source', () => {
  assert.equal(nutritionOverrideSchema.safeParse({ per100g: flour, grams: 200 }).success, true);
  assert.equal(nutritionOverrideSchema.safeParse({ foodCode: 123, per100g: flour }).success, false);
  assert.equal(nutritionOverrideSchema.safeParse({ per100g: { ...flour, protein: -1 } }).success, false);
  assert.equal(nutritionOverrideSchema.safeParse({ grams: -1 }).success, false);
});
