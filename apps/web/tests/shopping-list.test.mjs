import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accountStorageKey, mergeShoppingItems } from '../src/local-planning.ts';

const item = (id, name, amount, unit, checked = false) => ({ id, name, amount, unit, checked });

test('Shopping quantities merge only when names and units match and items are pending', () => {
  const current = [item('1', 'Café', 3, 'g'), item('2', 'Café', 1, 'g', true)];
  const additions = [item('3', 'cafe', 4, 'G'), item('4', 'Café', 2, 'kg'), item('5', 'Café', null, 'g')];
  assert.deepEqual(mergeShoppingItems(current, additions), [{ ...current[0], amount: 7 }, current[1], ...additions.slice(1)]);
  assert.equal(current[0].amount, 3);
});

test('Shopping storage keys are scoped to the signed-in account', () => {
  assert.notEqual(accountStorageKey('shopping', 'a@example.org'), accountStorageKey('shopping', 'b@example.org'));
});
