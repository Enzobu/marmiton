import { readFileSync } from 'node:fs';
import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

function readRevision() {
  try { return readFileSync('/app/build-revision', 'utf8').trim(); }
  catch { return ''; }
}

export function registerVersion(app: FastifyInstance, db: PrismaClient, revision = readRevision()) {
  app.get('/api/version', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (!/^[0-9a-f]{40}$/.test(revision)) return reply.code(503).send({ error: 'Build revision unavailable' });
    try { await db.$queryRaw`SELECT 1`; }
    catch { return reply.code(503).send({ error: 'Database unavailable' }); }
    return { sha: revision };
  });
}
