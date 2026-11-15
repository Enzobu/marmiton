import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from './app.js';

test('Version endpoint fails closed without a build revision', async () => {
  const app = buildApp({ revision: 'unavailable' });
  try {
    const response = await app.inject('/api/version');
    assert.equal(response.statusCode, 503);
    assert.equal(response.headers['cache-control'], 'no-store');
  } finally { await app.close(); }
});

test('Build revision is served only when MariaDB is reachable', { skip: !process.env.DATABASE_URL }, async () => {
  const sha = '1'.repeat(40);
  const app = buildApp({ revision: sha });
  try {
    const response = await app.inject('/api/version');
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { sha });
  } finally { await app.close(); }
});
