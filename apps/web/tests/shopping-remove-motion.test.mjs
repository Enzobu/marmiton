import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const component = readFileSync(new URL('../src/ShoppingList.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/planning.css', import.meta.url), 'utf8');

test('Shopping row is animated only after a successful DELETE', () => {
  assert.match(component, /await planningRequest\(id \? path \+ '\/' \+ id : path, token, options\);[\s\S]*?setRemovingId\(id\)/);
  assert.match(component, /updateData\(applyUpdate\)/);
  assert.match(component, /current => current\.filter\(row => row\.id !== item\.id\), item\.id, true/);
  assert.match(component, /setRemovingId\(null\)/);
});

test('Shopping removal supports motion preferences', () => {
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(styles, /\.planning-list>li\.shopping-item-removing/);
  assert.match(styles, /@keyframes shopping-item-remove/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
});

test('Remove action is available in all-items and by-recipe views', () => {
  assert.match(component, /function renderItems\(rows: ShoppingItem\[\]\)/);
  assert.match(component, /groupByRecipe\(items\)[\s\S]*?renderItems\(rows\)/);
  assert.match(component, /: renderItems\(items\)/);
  assert.doesNotMatch(component, /allowRemove/);
});
