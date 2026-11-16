import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';
import { parseImage } from './images.js';
import { RECIPE_JSON_EXAMPLE } from './recipe-json.js';

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCt8AAAAASUVORK5CYII=';
const fixtureEmail = 'owner@example.invalid';
const fixturePassword = 'Fixture-Password42';

test('Image validation rejects data with the wrong format', () => {
  assert.equal(parseImage(png)?.extension, 'png');
  assert.equal(parseImage(png.replace('png', 'webp')), null);
  assert.equal(parseImage('data:image/svg+xml;base64,PHN2Zz4='), null);
});

test('Images are accepted at 5 MB and rejected one byte over', () => {
  const encode = (size: number) => {
    const bytes = Buffer.alloc(size);
    Buffer.from(png.split(',')[1], 'base64').copy(bytes);
    return 'data:image/png;base64,' + bytes.toString('base64');
  };
  assert.equal(parseImage(encode(5_000_000))?.bytes.length, 5_000_000);
  assert.equal(parseImage(encode(5_000_001)), null);
});

test('Owner CRUD persists related rows and removes replaced images', { skip: !process.env.DATABASE_URL }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'marmiton-uploads-'));
  const app = buildApp({ uploadDirectory: dir });
  const db = new PrismaClient();
  let id = '';
  let headers: { authorization: string } | undefined;
  try {
    const login = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: fixtureEmail, password: fixturePassword } });
    assert.equal(login.statusCode, 200);
    headers = { authorization: `Bearer ${login.json().accessToken}` };
    const body = { recipe: RECIPE_JSON_EXAMPLE, isPublic: false, photo: png };
    assert.equal((await app.inject({ method: 'POST', url: '/recipes', payload: body })).statusCode, 401);
    const invalid = await app.inject({ method: 'POST', url: '/recipes', headers, payload: { ...body, photo: 'bad' } });
    assert.equal(invalid.statusCode, 400);
    const created = await app.inject({ method: 'POST', url: '/recipes', headers, payload: body });
    assert.equal(created.statusCode, 201);
    id = created.json().id;
    const image = created.json().image;
    const readIcons = async () => (await db.recipeIngredient.findMany({
      where: { recipeId: id }, orderBy: { position: 'asc' }, select: { icon: true },
    })).map(item => item.icon);
    assert.deepEqual(await readIcons(), ['meat', 'vegetable']);
    await db.recipeIngredient.updateMany({ where: { recipeId: id, position: 0 }, data: { icon: 'other' } });
    await db.recipeIngredient.updateMany({ where: { recipeId: id, position: 1 }, data: { icon: 'spice' } });
    const path = `/recipes/${id}`;
    assert.equal((await app.inject(path)).statusCode, 404);
    const detail = await app.inject({ url: path, headers });
    assert.equal(detail.statusCode, 200);
    assert.deepEqual(detail.json().quantities.map((item: { icon: string }) => item.icon), ['meat', 'spice']);
    assert.deepEqual(await readIcons(), ['other', 'spice']);
    assert.equal((await app.inject(image)).statusCode, 404);
    assert.equal((await app.inject({ url: image, headers })).headers['content-type'], 'image/png');
    const update = await app.inject({ method: 'PUT', url: path, headers, payload: {
      recipe: { ...RECIPE_JSON_EXAMPLE, title: 'Recette de test', difficulty: 'Difficile', steps: ['Étape mise à jour'] }, isPublic: true,
    } });
    assert.equal(update.statusCode, 200);
    assert.deepEqual(update.json().steps, ['Étape mise à jour']);
    assert.equal(update.json().difficulty, 'Difficile');
    assert.deepEqual(await readIcons(), ['meat', 'spice']);
    const catalog = await app.inject('/recipes?difficulty=Difficile');
    assert.equal(catalog.statusCode, 200);
    assert.ok(catalog.json().items.some((recipe: { id: string }) => recipe.id === id));
    assert.equal((await app.inject(path)).statusCode, 200);
    assert.deepEqual(await readdir(dir), []);
    assert.equal((await app.inject({ method: 'DELETE', url: path, headers })).statusCode, 204);
    assert.equal((await app.inject(path)).statusCode, 404);
  } finally {
    if (id && headers) await app.inject({ method: 'DELETE', url: `/recipes/${id}`, headers });
    await db.$disconnect();
    await app.close();
    await rm(dir, { recursive: true });
  }
});
