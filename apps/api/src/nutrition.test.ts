import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { nutritionOverrideSchema, recipeNutrition, summarizeNutrition } from './nutrition.js';
import { ingredientWeight } from './nutrition-weight.js';

const flour = { kcal: 350, protein: 10, carbs: 70, fat: 2 };

test('Nutrition converts mass units, estimates edible egg weight and allows a weight correction', () => {
  assert.equal(ingredientWeight('Farine', 0.25, 'kg'), 250);
  assert.equal(ingredientWeight('Farine', 250, 'mg'), 0.25);
  assert.equal(ingredientWeight('Œufs', 2, 'pièce(s)'), 100);
  assert.equal(ingredientWeight('Œufs', 2, 'pièce(s)', 114), 114);
  assert.equal(ingredientWeight('Huile d’olive', 1, 'c. à soupe'), null);
  assert.equal(ingredientWeight('Farine', null, 'g'), null);
  assert.equal(ingredientWeight('Oignon', 2, ''), 200);
  assert.equal(ingredientWeight("Gousses d’ail", 3, ''), 9);
  assert.equal(ingredientWeight('Carotte', 1, ''), 70);
  assert.equal(ingredientWeight('Bouillon de volaille', 400, 'ml'), 400);
  assert.equal(ingredientWeight('Lait demi-écrémé', 200, 'mL'), 206);
  assert.equal(ingredientWeight('Lait demi-écrémé UHT', 20, 'cL'), 206);
  assert.equal(ingredientWeight('Lait demi-écrémé', 1, 'L'), 1030);
  assert.equal(ingredientWeight('Lait demi-écrémé', 200, 'g'), 200);
  assert.equal(ingredientWeight('Lait demi-écrémé', 200, 'ml', 210), 210);
  assert.equal(ingredientWeight('Levure chimique', 0.5, 'sachet'), 5.5);
  assert.equal(ingredientWeight('Levure de boulanger', 1, 'sachet'), null);
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

test('Recipe nutrition resolves the main ingredients in cassoulet, lentils with beef and fish lasagna', { skip: !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const ingredients: [string, number | null, string][] = [
    ['Haricots blancs cuits et égouttés', 800, 'g'],
    ['Saucisses de Toulouse', 400, 'g'],
    ['Échine de porc', 300, 'g'],
    ['Pulpe de tomate', 300, 'g'],
    ['Oignon', 2, ''],
    ["Gousses d'ail", 3, ''],
    ['Carotte', 1, ''],
    ['Bouillon de volaille', 400, 'ml'],
    ['Concentré de tomate', 20, 'g'],
    ["Huile d'olive", 10, 'g'],
    ['Thym', 2, 'branches'],
    ['Feuille de laurier', 2, ''],
    ['Sel', null, ''],
    ['Poivre', null, ''],
  ];
  const lentils: typeof ingredients = [
    ['Bœuf à bourguignon', 1800, 'g'],
    ['Saucisses de Toulouse', 1000, 'g'],
    ['Lentilles vertes sèches', 750, 'g'],
    ['Carottes', 900, 'g'],
    ['Champignons de Paris', 800, 'g'],
    ['Gros oignons', 6, ''],
    ["Tête d'ail", 1, ''],
    ['Olives vertes', 200, 'g'],
    ['Cubes de bouillon de bœuf', 2, ''],
    ['Thym', 4, 'branches'],
    ['Feuilles de laurier', 3, ''],
    ['Eau', null, 'ml'],
    ['Poivre', null, ''],
  ];
  const lasagna: typeof ingredients = [
    ['Feuilles de lasagnes sèches', 250, 'g'],
    ['Saumon, sauvage, cru', 350, 'g'],
    ['Cabillaud, cru', 350, 'g'],
    ['Épinards surgelés en branches', 500, 'g'],
    ['Oignon', 1, ''],
    ["Gousses d'ail", 2, ''],
    ["Huile d'olive", 10, 'g'],
    ['Beurre doux', 60, 'g'],
    ['Farine de blé', 60, 'g'],
    ['Lait demi-écrémé', 800, 'g'],
    ['Citron', 1, ''],
    ['Muscade moulue', 1, 'pincée'],
    ['Sel', null, ''],
    ['Poivre', null, ''],
  ];
  const calculate = (rows: typeof ingredients, portions: number) => recipeNutrition(db, rows.map(([name, quantity, unit]) => ({
    name, quantity: quantity === null ? null : { toNumber: () => quantity }, unit, nutrition: null,
  })), portions);
  try {
    const cassoulet = await calculate(ingredients, 4);
    assert.deepEqual(cassoulet.missing.map(row => row.name), ['Thym', 'Feuille de laurier', 'Poivre']);
    assert.deepEqual(Object.values(cassoulet.perPortion).map(value => Math.round(value ?? -1)), [802, 43, 33, 49]);
    const stew = await calculate(lentils, 12);
    assert.deepEqual(stew.missing.map(row => row.name), ['Thym', 'Feuilles de laurier', 'Poivre']);
    assert.deepEqual(Object.values(stew.perPortion).map(value => Math.round(value ?? -1)), [818, 66, 39, 41]);
    const fishLasagna = await calculate(lasagna, 6);
    assert.deepEqual(fishLasagna.missing.map(row => row.name), ['Poivre']);
    assert.deepEqual(Object.values(fishLasagna.perPortion).map(value => value?.toFixed(1)), ["515.9", "36.9", "46.6", "19.1"]);
  } finally {
    await db.$disconnect();
  }
});

test('Recipe nutrition estimates macros for banana whey, plain skyr, milk and baking powder', { skip: !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const ingredients = [
    { name: 'Whey banane', quantity: { toNumber: () => 30 }, unit: 'g', nutrition: null },
    { name: 'Skyr nature', quantity: { toNumber: () => 100 }, unit: 'g', nutrition: null },
    { name: 'Lait demi-écrémé', quantity: { toNumber: () => 200 }, unit: 'ml', nutrition: null },
    { name: 'Levure chimique', quantity: { toNumber: () => 0.5 }, unit: 'sachet', nutrition: null },
  ];
  try {
    const summary = await recipeNutrition(db, ingredients, 2);
    assert.deepEqual(summary.missing, []);
    assert.deepEqual(Object.values(summary.total).map(value => value?.toFixed(2)), ['276.50', '39.47', '17.12', '5.32']);
    assert.equal(summary.perPortion.kcal?.toFixed(2), '138.25');

    const manualWhey = { ...ingredients[0], nutrition: { per100g: { kcal: 400, protein: 80, carbs: 5, fat: 6 } } };
    const corrected = await recipeNutrition(db, [manualWhey, ...ingredients.slice(1)], 2);
    assert.deepEqual(corrected.missing, []);
    assert.equal(corrected.total.protein?.toFixed(2), '40.97');
  } finally {
    await db.$disconnect();
  }
});
