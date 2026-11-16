import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inferIngredientIcon } from './ingredient-icons.js';

test('Ingredient icons recognize French plurals, accents and whole words', () => {
  for (const [name, icon] of [
    ['POMMES', 'vegetable'],
    ['Pomme', 'vegetable'],
    ['ÉPINARDS frais', 'vegetable'],
    ['Émincé de bœuf', 'meat'],
    ['Beurre doux', 'dairy'],
    ['ŒUFS frais', 'dairy'],
    ['Farine de blé', 'grain'],
    ['Pâtes complètes', 'grain'],
    ['Cannelle moulue', 'spice'],
    ['Poivrons rouges', 'vegetable'],
    ['Vinaigre balsamique', 'other'],
    ['Concentré salé', 'other'],
  ]) assert.equal(inferIngredientIcon(name), icon, name);
});

test('Compound ingredients take precedence over individual words', () => {
  for (const [name, icon] of [
    ['Pommes de terre grenaille', 'vegetable'],
    ['Pâte feuilletée pur beurre', 'grain'],
    ['Petits pois surgelés', 'vegetable'],
    ['Lait d’amandes', 'other'],
    ['Beurre de cacahuètes', 'other'],
    ['Sucre vanillé', 'grain'],
  ]) assert.equal(inferIngredientIcon(name), icon, name);
});

test('Cassoulet ingredients distinguish meats, aromatics and cooking preparations', () => {
  for (const [name, icon] of [
    ['Haricots blancs secs', 'vegetable'],
    ['Cuisses de canard confites', 'meat'],
    ['Saucisses de Toulouse', 'meat'],
    ['Poitrine de porc', 'meat'],
    ['Oignon', 'vegetable'],
    ['Carotte', 'vegetable'],
    ['Gousses d’ail', 'vegetable'],
    ['Bouquet garni', 'spice'],
    ['Bouillon de volaille peu salé', 'other'],
    ['Graisse de canard', 'other'],
    ['Poivre noir', 'spice'],
    ['Bouquets garnis', 'spice'],
    ['Fond de veau', 'other'],
    ['Huile d’olive', 'other'],
  ]) assert.equal(inferIngredientIcon(name), icon, name);
});
