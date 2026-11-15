import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSession } from './auth.js';
import { recipeResponse, recipeRelations } from './catalog.js';
import { imageStore, imageNamePattern, parseImage } from './images.js';
import { validateRecipeJson, type RecipeJson } from './recipe-json.js';

const payload = z.object({
  recipe: z.unknown(),
  isPublic: z.boolean(),
  photo: z.string().max(2_666_700).optional(),
  keepPhoto: z.boolean().optional(),
}).strict();

function recipeData(doc: RecipeJson, isPublic: boolean, imagePath: string | null) {
  const { preparation, cooking, rest } = doc.times;
  return {
    title: doc.title.trim(), description: doc.description.trim(), category: doc.category,
    difficulty: doc.difficulty, budget: doc.budget, servings: doc.servings,
    prepMinutes: preparation, cookMinutes: cooking, restMinutes: rest, totalMinutes: preparation + cooking + rest,
    utensils: doc.utensils.map(value => value.trim()), imagePath, isPublic,
  };
}

function childData(doc: RecipeJson) {
  return {
    ingredients: doc.ingredients.map((item, position) => ({ name: item.name.trim(), quantity: item.quantity, unit: item.unit.trim(), icon: 'other', position })),
    steps: doc.steps.map((content, position) => ({ content: content.trim(), position })),
  };
}

export function registerRecipeWrites(app: FastifyInstance, db: PrismaClient, images: ReturnType<typeof imageStore>) {
  const cleanup = (path: string | null | undefined) => images.remove(path).catch(() => app.log.error('Could not remove obsolete upload'));
  app.get('/me/recipes', async (request, reply) => {
    if (!await requireSession(request, reply, db)) return;
    const recipes = await db.recipe.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], include: recipeRelations });
    return recipes.map(recipeResponse);
  });

  app.get('/media/:name', async (request, reply) => {
    const { name } = request.params as { name: string };
    if (!imageNamePattern.test(name)) return reply.code(404).send({ error: 'Image not found' });
    const recipe = await db.recipe.findFirst({ where: { imagePath: '/media/' + name }, select: { isPublic: true } });
    if (!recipe || (!recipe.isPublic && !request.headers.authorization)) return reply.code(404).send({ error: 'Image not found' });
    if (!recipe.isPublic && !await requireSession(request, reply, db)) return;
    const image = await images.read(name);
    if (!image) return reply.code(404).send({ error: 'Image not found' });
    return reply.type(image.type).header('X-Content-Type-Options', 'nosniff').header('Cache-Control', 'no-store').send(image.bytes);
  });

  for (const method of ['POST', 'PUT'] as const) {
    app.route({
      method, url: method === 'POST' ? '/recipes' : '/recipes/:id', bodyLimit: 3_600_000,
      async handler(request, reply) {
        if (!await requireSession(request, reply, db)) return;
        const id = (request.params as { id?: string } | undefined)?.id;
        if (id && !z.string().uuid().safeParse(id).success) return reply.code(400).send({ error: 'Invalid recipe UUID' });
        const input = payload.safeParse(request.body);
        if (!input.success) return reply.code(400).send({ error: 'Invalid recipe payload' });
        const checked = validateRecipeJson(input.data.recipe);
        if (!checked.ok) return reply.code(400).send({ error: checked.error });
        const { photo, keepPhoto, isPublic } = input.data;
        const image = photo ? parseImage(photo) : null;
        if (photo && !image) return reply.code(400).send({ error: 'Invalid image' });
        const imagePath = image ? await images.put(image) : checked.value.imageUrl;
        const children = childData(checked.value);
        try {
          if (!id) {
            const recipe = await db.recipe.create({
              data: {
                ...recipeData(checked.value, isPublic, imagePath),
                ingredients: { create: children.ingredients }, steps: { create: children.steps },
              },
              include: recipeRelations,
            });
            return reply.code(201).send(recipeResponse(recipe));
          }

          const changed = await db.$transaction(async tx => {
            const [previous] = await tx.$queryRaw<{ imagePath: string | null }[]>`SELECT imagePath FROM Recipe WHERE id = ${id} FOR UPDATE`;
            if (!previous) return null;
            const nextImage = keepPhoto && !image ? previous.imagePath : imagePath;
            await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
            await tx.recipeStep.deleteMany({ where: { recipeId: id } });
            const recipe = await tx.recipe.update({
              where: { id },
              data: {
                ...recipeData(checked.value, isPublic, nextImage),
                ingredients: { create: children.ingredients }, steps: { create: children.steps },
              },
              include: recipeRelations,
            });
            return { recipe, obsolete: previous.imagePath === nextImage ? null : previous.imagePath };
          });
          if (!changed) {
            if (image) await cleanup(imagePath);
            return reply.code(404).send({ error: 'Recipe not found' });
          }
          await cleanup(changed.obsolete);
          return recipeResponse(changed.recipe);
        } catch (error) {
          if (image) await cleanup(imagePath);
          throw error;
        }
      },
    });
  }

  app.delete('/recipes/:id', async (request, reply) => {
    if (!await requireSession(request, reply, db)) return;
    const id = z.string().uuid().safeParse((request.params as { id: string }).id);
    if (!id.success) return reply.code(400).send({ error: 'Invalid recipe UUID' });
    const result = await db.$transaction(async tx => {
      const [recipe] = await tx.$queryRaw<{ imagePath: string | null }[]>`SELECT imagePath FROM Recipe WHERE id = ${id.data} FOR UPDATE`;
      if (!recipe) return null;
      await tx.recipe.delete({ where: { id: id.data } });
      return recipe;
    });
    if (!result) return reply.code(404).send({ error: 'Recipe not found' });
    await cleanup(result.imagePath);
    return reply.code(204).send();
  });
}
