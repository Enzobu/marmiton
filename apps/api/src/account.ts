import { Prisma, type PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { preferencesSelect, profileResponse, profileSelect, requireSession } from './auth.js';
import { recipeRelations, recipeResponse } from './catalog.js';
import { imageUploadBodyLimit, maxImageDataUrlLength } from './image-limits.js';
import { imageNamePattern, imageStore, parseImage } from './images.js';

const name = z.string().trim().min(1).max(70);
const profileSchema = z.object({
  firstName: name, lastName: name, bio: z.string().trim().max(1000),
  newsletter: z.boolean(), publicRecipes: z.boolean(),
  photo: z.string().max(maxImageDataUrlLength).nullable().optional(),
}).strict();
const preferencesSchema = z.object({
  developerMode: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  initialize: z.boolean().optional(),
}).strict().refine(({ developerMode, theme }) => developerMode !== undefined || theme !== undefined);
const uuid = z.string().uuid();

export function registerAccount(app: FastifyInstance, db: PrismaClient, images: ReturnType<typeof imageStore>) {
  const cleanup = (path: string | null | undefined) => images.remove(path).catch(() => app.log.error('Could not remove obsolete avatar'));

  app.put('/me/profile', { bodyLimit: imageUploadBodyLimit }, async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid profile' });
    const { photo, ...fields } = parsed.data;
    const image = typeof photo === 'string' ? parseImage(photo) : null;
    if (typeof photo === 'string' && !image) return reply.code(400).send({ error: 'Invalid avatar' });
    const newAvatar = image ? await images.put(image) : photo === null ? null : undefined;
    try {
      const result = await db.$transaction(async tx => {
        const [previous] = await tx.$queryRaw<{ avatar: string | null }[]>`SELECT avatar FROM Owner WHERE id = ${session.ownerId} FOR UPDATE`;
        const owner = await tx.owner.update({
          where: { id: session.ownerId }, data: { ...fields, avatar: newAvatar }, select: profileSelect,
        });
        return { owner, oldAvatar: previous?.avatar };
      });
      if (newAvatar !== undefined && newAvatar !== result.oldAvatar) await cleanup(result.oldAvatar);
      return profileResponse(result.owner);
    } catch (error) {
      if (image) await cleanup(newAvatar);
      throw error;
    }
  });

  app.patch('/me/preferences', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const parsed = preferencesSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid preferences' });
    const { initialize, developerMode, theme } = parsed.data;
    const where = { id: session.ownerId };

    if (!initialize) {
      return db.owner.update({ where, data: { developerMode, theme }, select: preferencesSelect });
    }
    // Each legacy preference may be adopted once, even if two devices sign in together.
    return db.$transaction(async tx => {
      if (developerMode !== undefined) {
        await tx.owner.updateMany({ where: { ...where, developerMode: null }, data: { developerMode } });
      }
      if (theme !== undefined) {
        await tx.owner.updateMany({ where: { ...where, theme: null }, data: { theme } });
      }
      return tx.owner.findUniqueOrThrow({ where, select: preferencesSelect });
    });
  });

  app.get('/me/avatar/:name', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const { name: filename } = request.params as { name: string };
    if (!imageNamePattern.test(filename) || session.owner.avatar !== '/media/' + filename) {
      return reply.code(404).send({ error: 'Avatar not found' });
    }
    const picture = await images.read(filename);
    if (!picture) return reply.code(404).send({ error: 'Avatar not found' });
    return reply.type(picture.type).header('X-Content-Type-Options', 'nosniff').send(picture.bytes);
  });

  app.get('/me/favorites', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const saved = await db.favorite.findMany({
      where: { ownerId: session.ownerId },
      orderBy: [{ createdAt: 'desc' }, { recipeId: 'asc' }],
      include: { recipe: { include: recipeRelations } },
    });
    return saved.map(item => recipeResponse(item.recipe));
  });

  app.put('/me/favorites/:id', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const id = uuid.safeParse((request.params as { id: string }).id);
    if (!id.success) return reply.code(400).send({ error: 'Invalid recipe UUID' });
    const ownerId = session.ownerId;
    const recipeId = id.data;
    try {
      await db.favorite.create({ data: { ownerId, recipeId } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2003') return reply.code(404).send({ error: 'Recipe not found' });
      if (error.code !== 'P2002') throw error;
    }
    return reply.code(204).send();
  });

  app.delete('/me/favorites/:id', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const id = uuid.safeParse((request.params as { id: string }).id);
    if (!id.success) return reply.code(400).send({ error: 'Invalid recipe UUID' });
    await db.favorite.deleteMany({ where: { ownerId: session.ownerId, recipeId: id.data } });
    return reply.code(204).send();
  });
}
