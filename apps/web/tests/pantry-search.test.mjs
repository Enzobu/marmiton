import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pantryMatches } from '../src/pantry-search.ts';

test('Pantry results rank complete recipes first and report up to two missing ingredients', () => {
  const recipes = [
    { title: 'Crêpes', ingredients: ['Œufs', 'Farine', 'Lait'] },
    { title: 'Omelette', ingredients: ['œufs'] },
    { title: 'Pain', ingredients: ['Farine', 'Eau', 'Levure', 'Sel'] },
    { title: 'Salade', ingredients: ['Laitue'] },
  ];
  const results = pantryMatches(recipes, 'OEUFS, farine');
  assert.deepEqual(results.map(({ recipe, missing }) => [recipe.title, missing]), [['Omelette', []], ['Crêpes', ['Lait']]]);
  assert.deepEqual(pantryMatches(recipes, ' , '), []);
});
