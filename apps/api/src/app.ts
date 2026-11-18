import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { registerAuth } from './auth.js';
import type { SendResetMail } from './reset-mail.js';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { registerAccount } from './account.js';
import { registerPlanning } from './planning.js';
import { imageStore } from './images.js';
import { registerRecipeWrites } from './recipe-writes.js';
import { registerVersion } from './version.js';
import { registerCatalog } from './catalog.js';
import { registerNutrition } from './nutrition.js';

const healthResponse = z.object({ status: z.literal('ok'), service: z.literal('marmiton-api') });

export function buildApp(options: { mail?: SendResetMail; uploadDirectory?: string; revision?: string } = {}) {
  const app = Fastify({ logger: true });
  app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',').map(value => value.trim()) ?? ['http://localhost:5173'], methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] });
  app.register(rateLimit, { global: false });
  app.get('/health', async () => healthResponse.parse({ status: 'ok', service: 'marmiton-api' }));
  const db = new PrismaClient();
  app.addHook('onClose', () => db.$disconnect());
  registerCatalog(app, db);
  registerNutrition(app, db);
  registerVersion(app, db, options.revision);
  const images = imageStore(options.uploadDirectory);
  registerRecipeWrites(app, db, images);
  registerAccount(app, db, images);
  registerPlanning(app, db);
  app.after(() => registerAuth(app, db, options.mail));
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: 'Not Found' }));
  return app;
}
