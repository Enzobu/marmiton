import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from './app.js';

test('GET /health returns service status', async () => {
  const app = buildApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: 'ok', service: 'marmiton-api' });
  } finally {
    await app.close();
  }
});

test('unknown route returns 404', async () => {
  const app = buildApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/missing' });
    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error, 'Not Found');
  } finally {
    await app.close();
  }
});
