import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { registerCatalog } from './catalog.js';

const healthResponse = z.object({ status: z.literal('ok'), service: z.literal('marmiton-api') });

export function buildApp() {
  const app = Fastify({ logger: true });
  app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] });
  app.get('/health', async () => healthResponse.parse({ status: 'ok', service: 'marmiton-api' }));
  const db = new PrismaClient();
  app.addHook('onClose', () => db.$disconnect());
  registerCatalog(app, db);
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: 'Not Found' }));
  return app;
}
