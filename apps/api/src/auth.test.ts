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
  const email = 'owner@example.invalid';
  const password = 'Fixture-Password42';
  const replacement = 'Replacement-Password43';
  const originalHash = await hashPassword(password);
  let resetToken = '';
  const app = buildApp({ mail: async (_email, token) => { resetToken = token; } });
  try {
    await db.owner.upsert({
      where: { id: 1 }, create: { id: 1, email, firstName: 'Test', lastName: 'Owner', passwordHash: originalHash },
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
    await db.owner.updateMany({ where: { id: 1 }, data: { passwordHash: originalHash } });
    await db.session.deleteMany({ where: { ownerId: 1 } });
    await app.close();
    await db.$disconnect();
  }
});
