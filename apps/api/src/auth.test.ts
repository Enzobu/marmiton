import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';
import { hashPassword, verifyPassword } from './password.js';

test('Passwords use salted hashes and reject incorrect values', async () => {
  const first = await hashPassword('Example-Password42');
  assert.notEqual(first, await hashPassword('Example-Password42'));
  assert.equal(await verifyPassword('Example-Password42', first), true);
  assert.equal(await verifyPassword('wrong', first), false);
});

test('Owner session expires and reset revokes sessions and consumes its token', { skip: !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const email = 'auth-test@example.invalid';
  const password = 'Fixture-Password42';
  const replacement = 'Replacement-Password43';
  const originalHash = await hashPassword(password);
  let resetToken = '';
  const app = buildApp({ mail: async (_email, token) => { resetToken = token; } });
  try {
    await db.owner.upsert({
      where: { id: 2 }, create: { id: 2, email, firstName: 'Test', lastName: 'Owner', passwordHash: originalHash },
      update: { passwordHash: originalHash },
    });
    const login = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
    assert.equal(login.statusCode, 200);
    const token = login.json().accessToken as string;
    const headers = { authorization: `Bearer ${token}` };
    assert.equal((await app.inject({ url: '/auth/me', headers })).statusCode, 200);
    await db.session.update({ where: { digest: createHash('sha256').update(token).digest('hex') }, data: { expiresAt: new Date(0) } });
    assert.equal((await app.inject({ url: '/auth/me', headers })).statusCode, 401);

    const active = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
    const activeHeaders = { authorization: `Bearer ${active.json().accessToken}` };
    const forgot = (address: string) => app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: address } });
    const missing = await forgot('missing@example.invalid');
    const requested = await forgot(email);
    assert.equal(requested.statusCode, 202);
    assert.deepEqual(requested.json(), missing.json());
    assert.ok(resetToken);
    const reset = () => app.inject({ method: 'POST', url: '/auth/reset-password', payload: { token: resetToken, password: replacement } });
    const resets = await Promise.all([reset(), reset()]);
    assert.deepEqual(resets.map(response => response.statusCode).sort(), [204, 400]);
    assert.equal((await app.inject({ url: '/auth/me', headers: activeHeaders })).statusCode, 401);
    assert.equal((await app.inject({ method: 'POST', url: '/auth/login', payload: { email, password: replacement } })).statusCode, 200);
  } finally {
    await db.owner.deleteMany({ where: { email } });
    await app.close();
    await db.$disconnect();
  }
});

test('Changing the password requires the current password and preserves only the current session', { skip: !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const email = 'change-password@example.invalid';
  const original = 'Existing-Password42';
  const replacement = 'New-Password43';
  const app = buildApp();
  try {
    await db.owner.create({ data: { id: 3, email, firstName: 'Test', lastName: 'Owner', passwordHash: await hashPassword(original) } });
    const login = (password: string) => app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
    const first = await login(original);
    const second = await login(original);
    assert.equal(first.statusCode, 200);
    assert.equal(second.statusCode, 200);
    const headers = { authorization: `Bearer ${first.json().accessToken}` };
    const other = { authorization: `Bearer ${second.json().accessToken}` };
    await db.passwordReset.create({ data: { digest: '3'.repeat(64), ownerId: 3, expiresAt: new Date(Date.now() + 60000) } });
    const change = (currentPassword: string, authorization?: typeof headers) =>
      app.inject({ method: 'POST', url: '/auth/change-password', headers: authorization, payload: { currentPassword, newPassword: replacement } });
    assert.equal((await change(original)).statusCode, 401);
    assert.equal((await change('wrong', headers)).statusCode, 403);
    assert.equal((await change(original, headers)).statusCode, 204);
    assert.equal((await app.inject({ url: '/auth/me', headers })).statusCode, 200);
    assert.equal((await app.inject({ url: '/auth/me', headers: other })).statusCode, 401);
    assert.equal(await db.passwordReset.count({ where: { ownerId: 3 } }), 0);
    assert.equal((await login(original)).statusCode, 401);
    assert.equal((await login(replacement)).statusCode, 200);
  } finally {
    await app.close();
    await db.owner.deleteMany({ where: { email } });
    await db.$disconnect();
  }
});
