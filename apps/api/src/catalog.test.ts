import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from './app.js';

test('catalog rejects invalid pagination, filters and identifiers', async () => {
  const app = buildApp();
  try {
    for (const url of ['/recipes?limit=0', '/recipes?page=0', '/recipes?category=unknown', '/recipes/not-a-uuid']) {
      assert.equal((await app.inject(url)).statusCode, 400, url);
    }
  } finally {
    await app.close();
  }
});

test('catalog reads seeded recipes with filters and pagination on MariaDB', { skip: !process.env.DATABASE_URL }, async () => {
  const app = buildApp();
  try {
    const results = await app.inject('/recipes?category=Desserts&maxTime=30&sort=time&limit=1');
    assert.equal(results.statusCode, 200);
    const { items, total } = results.json();
    assert.equal(total, 2);
    assert.equal(items[0].time, 25);
    const detail = await app.inject(`/recipes/${items[0].id}`);
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json().quantities.length, 5);
    assert.equal(detail.json().steps.length, 3);
    assert.equal((await app.inject('/recipes?q=creme')).json().total, 1);
    assert.equal((await app.inject('/recipes/00000000-0000-4000-8000-999999999999')).statusCode, 404);
    const cors = await app.inject({ method: 'OPTIONS', url: '/recipes', headers: {
      origin: 'http://localhost:5173', 'access-control-request-method': 'GET',
    } });
    assert.equal(cors.headers['access-control-allow-origin'], 'http://localhost:5173');
  } finally {
    await app.close();
  }
});
