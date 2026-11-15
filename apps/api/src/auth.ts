import { createHash, randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { emailSchema, hashPassword, passwordSchema, verifyPassword } from './password.js';
import { sendResetMail, type SendResetMail } from './reset-mail.js';

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128), remember: z.boolean().optional() }).strict();
const resetSchema = z.object({ token: tokenSchema, password: passwordSchema }).strict();
const profileSelect = { email: true, firstName: true, lastName: true, bio: true, newsletter: true, publicRecipes: true, avatar: true } as const;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const newToken = () => randomBytes(32).toString('base64url');

export async function requireSession(request: FastifyRequest, reply: FastifyReply, db: PrismaClient) {
  reply.header('cache-control', 'no-store');
  const token = tokenSchema.safeParse(/^Bearer ([^ ]+)$/i.exec(request.headers.authorization ?? '')?.[1]);
  const session = token.success ? await db.session.findUnique({
    where: { digest: digest(token.data), expiresAt: { gt: new Date() } },
    include: { owner: { select: profileSelect } },
  }) : null;
  if (!session) reply.code(401).send({ error: 'Authentication required' });
  return session;
}

export function registerAuth(app: FastifyInstance, db: PrismaClient, mail: SendResetMail = sendResetMail) {
  const throttle = (max: number) => ({ config: { rateLimit: { max, timeWindow: '1 minute' } } });
  app.post('/auth/login', throttle(10), async (request, reply) => {
    reply.header('cache-control', 'no-store');
    const result = loginSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: 'Invalid login data' });

    const { email, password, remember } = result.data;
    const owner = await db.owner.findUnique({ where: { email }, select: { ...profileSelect, id: true, passwordHash: true } });
    const valid = await verifyPassword(password, owner?.passwordHash);
    if (!owner || !valid) return reply.code(401).send({ error: 'Invalid email or password' });
    const { id, passwordHash, ...profile } = owner;
    const now = new Date();
    const accessToken = newToken();
    const expiresAt = new Date(now.getTime() + (remember ? 7 * 24 : 12) * 60 * 60 * 1000);
    const issued = await db.$transaction(async tx => {
      const locked = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM Owner WHERE id = ${id} AND passwordHash = ${passwordHash} FOR UPDATE`;
      if (!locked.length) return false;
      await tx.session.deleteMany({ where: { ownerId: id, expiresAt: { lte: now } } });
      await tx.session.create({ data: { digest: digest(accessToken), expiresAt, ownerId: id } });
      return true;
    });
    if (!issued) return reply.code(401).send({ error: 'Invalid email or password' });
    return { accessToken, expiresAt, profile };
  });

  app.get('/auth/me', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (session) return session.owner;
  });

  app.post('/auth/logout', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    await db.session.deleteMany({ where: { digest: session.digest } });
    return reply.code(204).send();
  });

  app.post('/auth/forgot-password', throttle(5), async (request, reply) => {
    const parsed = z.object({ email: emailSchema }).strict().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid email' });
    const owner = await db.owner.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true } });
    if (owner) {
      const token = newToken();
      await db.$transaction([
        db.passwordReset.deleteMany({ where: { ownerId: owner.id, expiresAt: { lte: new Date() } } }),
        db.passwordReset.create({ data: { digest: digest(token), ownerId: owner.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } }),
      ]);
      void mail(owner.email, token).catch(() => request.log.error('Password reset email delivery failed'));
    }
    return reply.code(202).send({ message: 'If the address is registered, a link will be sent' });
  });

  app.post('/auth/reset-password', throttle(5), async (request, reply) => {
    const parsed = resetSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid password or reset token' });
    const tokenDigest = digest(parsed.data.token);
    const reset = await db.passwordReset.findUnique({ where: { digest: tokenDigest, expiresAt: { gt: new Date() } } });
    if (!reset) return reply.code(400).send({ error: 'Invalid or expired reset token' });
    const passwordHash = await hashPassword(parsed.data.password);
    const changed = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM Owner WHERE id = ${reset.ownerId} FOR UPDATE`;
      const used = await tx.passwordReset.deleteMany({ where: { digest: tokenDigest, expiresAt: { gt: new Date() } } });
      if (!used.count) return false;
      await tx.owner.update({ where: { id: reset.ownerId }, data: { passwordHash } });
      await tx.passwordReset.deleteMany({ where: { ownerId: reset.ownerId } });
      await tx.session.deleteMany({ where: { ownerId: reset.ownerId } });
      return true;
    });
    if (!changed) return reply.code(400).send({ error: 'Invalid or expired reset token' });
    return reply.code(204).send();
  });
}
