import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';

const fixture = { email: 'owner@example.invalid', password: 'Fixture-Password42' };
const seededId = '00000000-0000-4000-8000-000000000001';
const avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCt8AAAAASUVORK5CYII=';
const profile = { firstName: 'Test', lastName: 'Owner', bio: '', newsletter: false, publicRecipes: true };

test('Favorites and profile survive a new login and reject anonymous access', { skip: !process.env.DATABASE_URL }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'marmiton-profile-'));
  const db = new PrismaClient();
  const app = buildApp({ uploadDirectory: dir });
  const login = async () => {
    const result = await app.inject({ method: 'POST', url: '/auth/login', payload: fixture });
    assert.equal(result.statusCode, 200);
    return { authorization: `Bearer ${result.json().accessToken}` };
  };
  const toggle = (method: 'PUT' | 'DELETE', id: string, headers: { authorization: string }) =>
    app.inject({ method, url: `/me/favorites/${id}`, headers });
  const update = (payload: unknown, headers: { authorization: string }) => app.inject({ method: 'PUT', url: '/me/profile', headers, payload: payload as object });
  const preferences = (headers: { authorization: string }, payload: object) =>
    app.inject({ method: 'PATCH', url: '/me/preferences', headers, payload });
  const where = { email: fixture.email };
  const originalPreferences = await db.owner.findUniqueOrThrow({ where, select: { theme: true, developerMode: true } });
  try {
    await db.owner.update({ where, data: { theme: null, developerMode: null } });
    const first = await login();
    assert.equal((await app.inject('/me/favorites')).statusCode, 401);
    assert.equal((await update({ ...profile, firstName: '' }, first)).statusCode, 400);
    assert.equal((await toggle('PUT', '00000000-0000-4000-8000-999999999999', first)).statusCode, 404);
    const adds = await Promise.all([toggle('PUT', seededId, first), toggle('PUT', seededId, first)]);
    assert.deepEqual(adds.map(response => response.statusCode), [204, 204]);

    const changed = await update({ ...profile, firstName: 'Cuisine', bio: 'Un carnet', photo: avatar }, first);
    assert.equal(changed.statusCode, 200);
    const adoption = await preferences(first, { initialize: true, developerMode: true, theme: 'light' });
    assert.equal(adoption.statusCode, 200);
    assert.deepEqual(adoption.json(), { developerMode: true, theme: 'light' });
    assert.deepEqual((await preferences(first, { theme: 'dark' })).json(), { developerMode: true, theme: 'dark' });
    const stale = await preferences(first, { initialize: true, developerMode: false, theme: 'system' });
    assert.deepEqual(stale.json(), { developerMode: true, theme: 'dark' });
    const path = changed.json().avatar;
    assert.match(path, /^\/me\/avatar\//);
    assert.equal((await app.inject(path)).statusCode, 401);
    assert.equal((await app.inject({ url: path, headers: first })).headers['content-type'], 'image/png');
    assert.equal((await app.inject({ method: 'POST', url: '/auth/logout', headers: first })).statusCode, 204);

    const second = await login();
    const saved = await app.inject({ url: '/me/favorites', headers: second });
    assert.deepEqual(saved.json().map((recipe: { id: string }) => recipe.id), [seededId]);
    const reopened = (await app.inject({ url: '/auth/me', headers: second })).json();
    assert.equal(reopened.bio, 'Un carnet');
    assert.equal(reopened.developerMode, true);
    assert.equal(reopened.theme, 'dark');
    assert.equal((await update({ ...profile, photo: null }, second)).json().avatar, null);
    assert.deepEqual(await readdir(dir), []);
    assert.equal((await toggle('DELETE', seededId, second)).statusCode, 204);
    assert.equal((await toggle('DELETE', seededId, second)).statusCode, 204);
  } finally {
    const headers = await login();
    await db.owner.update({ where, data: originalPreferences });
    await db.$disconnect();
    await update({ ...profile, photo: null }, headers);
    await toggle('DELETE', seededId, headers);
    await app.close();
    await rm(dir, { recursive: true });
  }
});
