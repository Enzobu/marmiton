import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from './password.js';
import { buildApp } from './app.js';

const recipeId = '00000000-0000-4000-8000-000000000004';

test('Planning survives a new session, and concurrent additions combine quantities atomically', { skip: !process.env.DATABASE_URL }, async () => {
  const app = buildApp();
  const db = new PrismaClient();
  const email = 'planning-test@example.invalid';
  const password = 'Fixture-Password42';
  const ownerId = 8501;
  const otherOwnerId = 8502;
  const otherEmail = 'planning-other@example.invalid';
  const shopping = '/me/shopping-list';
  const menu = '/me/weekly-menu';
  const notes = '/me/recipe-notes/' + recipeId;
  const date = '2030-01-02';
  const login = async (account = email) => {
    const result = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: account, password } });
    assert.equal(result.statusCode, 200);
    return { authorization: 'Bearer ' + result.json().accessToken };
  };
  try {
    const passwordHash = await hashPassword(password);
    await db.owner.createMany({ data: [
      { id: ownerId, email, passwordHash, firstName: 'Planning', lastName: 'Test' },
      { id: otherOwnerId, email: otherEmail, passwordHash, firstName: 'Planning', lastName: 'Other' },
    ] });
    let headers = await login();
    const list = async () => (await app.inject({ url: shopping, headers })).json() as
      { id: string; name: string; amount: number; checked: boolean }[];
    const add = (id: string) => app.inject({ method: 'POST', url: shopping, headers, payload: { meals: [{ recipeId: id, servings: 2 }] } });
    assert.deepEqual((await Promise.all([add(recipeId), add(recipeId)])).map(result => result.statusCode), [204, 204]);
    const items = await list();
    const flour = items.find(item => item.name === 'Farine')!;
    assert.equal(flour.amount, 250);
    assert.equal((await app.inject({ method: 'PATCH', url: shopping + '/' + flour.id, headers, payload: { checked: true } })).statusCode, 204);
    const planned = await app.inject({ method: 'POST', url: menu, headers, payload: { recipeId, servings: 6, date } });
    assert.equal(planned.statusCode, 201);
    const mealId = planned.json().id;
    assert.equal((await app.inject({ method: 'PUT', url: notes, headers, payload: { note: 'Faire reposer la pâte.' } })).statusCode, 204);
    headers = await login();
    assert.equal((await list()).find(item => item.id === flour.id)?.checked, true);
    const week = await app.inject({ url: menu + '?from=2029-12-31', headers });
    assert.equal(week.statusCode, 200);
    assert.ok(week.json().some((meal: { id: string; date: string; servings: number }) => meal.id === mealId && meal.date === date && meal.servings === 6));
    assert.deepEqual((await app.inject({ url: notes, headers })).json(), { note: 'Faire reposer la pâte.' });
    assert.equal((await app.inject(notes)).statusCode, 401);
    headers = await login(otherEmail);
    assert.deepEqual(await list(), []);
    assert.deepEqual((await app.inject({ url: menu + '?from=2029-12-31', headers })).json(), []);
    assert.deepEqual((await app.inject({ url: notes, headers })).json(), { note: '' });
    assert.equal((await app.inject({ method: 'PATCH', url: shopping + '/' + flour.id, headers, payload: { checked: false } })).statusCode, 404);
  } finally {
    await db.owner.deleteMany({ where: { id: { in: [ownerId, otherOwnerId] }, email: { in: [email, otherEmail] } } });
    await db.$disconnect();
    await app.close();
  }
});
