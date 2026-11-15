import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localDateKey, weekDays } from '../src/weekly-menu.ts';

test('The week starts on Monday and handles year changes without UTC conversion', () => {
  const date = new Date(2026, 0, 1, 23, 30);
  const days = weekDays(date).map(localDateKey);
  assert.equal(days[0], '2025-12-29');
  assert.equal(days[6], '2026-01-04');
  assert.equal(localDateKey(weekDays(date, 1)[0]), '2026-01-05');
  assert.equal(localDateKey(date), '2026-01-01');
});
