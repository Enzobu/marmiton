import { Prisma, type PrismaClient, type ShoppingItem } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSession } from './auth.js';

const uuid = z.string().uuid();
const servings = z.number().int().min(1).max(12);
const selection = z.object({ recipeId: uuid, servings }).strict();
const shoppingBody = z.object({ meals: z.array(selection).min(1).max(100) }).strict();
const checkedBody = z.object({ checked: z.boolean() }).strict();
const noteBody = z.object({ note: z.string().max(4000) }).strict();
const day = z.string().regex(/^[1-9]\d{3}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}).transform(value => new Date(value + 'T00:00:00Z'));
const mealBody = selection.extend({ date: day });
const weekQuery = z.object({ from: day }).strict();

function normalize(value: string) {
  return value.toLocaleLowerCase('fr').normalize('NFD').replace(/\p{Mark}/gu, '')
    .replaceAll('œ', 'oe').replaceAll('’', "'").trim().replace(/\s+/g, ' ');
}

function ingredientKey(name: string, unit: string | null) {
  return JSON.stringify([normalize(name), normalize(unit ?? '')]);
}

function shoppingItem({ id, name, unit, amount, checked }: ShoppingItem) {
  return { id, name, unit, amount: amount?.toNumber() ?? null, checked };
}

function lockOwner(tx: Prisma.TransactionClient, ownerId: number) {
  return tx.$queryRaw`SELECT id FROM Owner WHERE id = ${ownerId} FOR UPDATE`;
}

export function registerPlanning(app: FastifyInstance, db: PrismaClient) {
  app.get('/me/shopping-list', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const items = await db.shoppingItem.findMany({
      where: { ownerId: session.ownerId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return reply.header('Cache-Control', 'no-store').send(items.map(shoppingItem));
  });

  app.post('/me/shopping-list', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const parsed = shoppingBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid meal selection' });
    const { ownerId } = session;
    const meals = parsed.data.meals;
    const ids = [...new Set(meals.map(meal => meal.recipeId.toLowerCase()))];
    const result = await db.$transaction(async tx => {
      // Serialize additions and edits to this account's list.
      await lockOwner(tx, ownerId);
      const recipes = await tx.recipe.findMany({
        where: { id: { in: ids } },
        select: { id: true, servings: true, ingredients: { orderBy: { position: 'asc' } } },
      });
      const byId = new Map(recipes.map(recipe => [recipe.id.toLowerCase(), recipe]));
      if (ids.some(id => !byId.has(id))) return false;

      const pending = await tx.shoppingItem.findMany({ where: { ownerId, checked: false, amount: { not: null } } });
      const existing = new Map(pending.map(item => [ingredientKey(item.name, item.unit), item.id]));
      const additions: { name: string; unit: string | null; amount: Prisma.Decimal | null }[] = [];
      const quantified = new Map<string, typeof additions[number]>();
      for (const meal of meals) {
        const recipe = byId.get(meal.recipeId.toLowerCase())!;
        for (const { name, unit, quantity } of recipe.ingredients) {
          const amount = quantity?.mul(meal.servings).div(recipe.servings) ?? null;
          if (amount === null) {
            additions.push({ name, unit, amount });
            continue;
          }
          const key = ingredientKey(name, unit);
          const previous = quantified.get(key);
          if (previous) previous.amount = previous.amount!.plus(amount);
          else {
            const addition = { name, unit, amount };
            quantified.set(key, addition);
            additions.push(addition);
          }
        }
      }

      const newItems = [];
      for (const item of additions) {
        const id = item.amount === null ? undefined : existing.get(ingredientKey(item.name, item.unit));
        if (id) await tx.shoppingItem.update({ where: { id }, data: { amount: { increment: item.amount! } } });
        else newItems.push({ ...item, ownerId });
      }
      if (newItems.length) await tx.shoppingItem.createMany({ data: newItems });
      return true;
    }, { timeout: 15000 });
    if (!result) return reply.code(404).send({ error: 'Recipe not found' });
    return reply.code(204).send();
  });

  app.patch('/me/shopping-list/:id', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const id = uuid.safeParse((request.params as { id: string }).id);
    const body = checkedBody.safeParse(request.body);
    if (!id.success || !body.success) return reply.code(400).send({ error: 'Invalid shopping item' });
    const where = { id: id.data, ownerId: session.ownerId };
    const result = await db.$transaction(async tx => {
      await lockOwner(tx, session.ownerId);
      return tx.shoppingItem.updateMany({ where, data: body.data });
    });
    if (!result.count) return reply.code(404).send({ error: 'Shopping item not found' });
    return reply.code(204).send();
  });

  app.delete('/me/shopping-list/:id', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const id = uuid.safeParse((request.params as { id: string }).id);
    if (!id.success) return reply.code(400).send({ error: 'Invalid shopping item ID' });
    await db.$transaction(async tx => {
      await lockOwner(tx, session.ownerId);
      await tx.shoppingItem.deleteMany({ where: { id: id.data, ownerId: session.ownerId } });
    });
    return reply.code(204).send();
  });

  app.get('/me/weekly-menu', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const query = weekQuery.safeParse(request.query);
    if (!query.success) return reply.code(400).send({ error: 'Invalid week start date' });
    const start = query.data.from;
    const end = new Date(start.getTime() + 6 * 86_400_000);
    const meals = await db.plannedMeal.findMany({
      where: { ownerId: session.ownerId, date: { gte: start, lte: end } },
      select: { id: true, recipeId: true, date: true, servings: true, recipe: { select: { title: true } } },
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
    });
    return reply.header('Cache-Control', 'no-store').send(meals.map(({ recipe, date, ...meal }) => ({
      ...meal, title: recipe.title, date: date.toISOString().slice(0, 10),
    })));
  });

  app.post('/me/weekly-menu', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const body = mealBody.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Invalid planned meal' });
    try {
      const meal = await db.plannedMeal.create({ data: { ...body.data, ownerId: session.ownerId } });
      return reply.code(201).send({ id: meal.id });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return reply.code(404).send({ error: 'Recipe not found' });
      }
      throw error;
    }
  });

  app.delete('/me/weekly-menu/:id', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const id = uuid.safeParse((request.params as { id: string }).id);
    if (!id.success) return reply.code(400).send({ error: 'Invalid planned meal ID' });
    await db.plannedMeal.deleteMany({ where: { id: id.data, ownerId: session.ownerId } });
    return reply.code(204).send();
  });

  app.get('/me/recipe-notes/:id', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const id = uuid.safeParse((request.params as { id: string }).id);
    if (!id.success) return reply.code(400).send({ error: 'Invalid recipe ID' });
    const recipeId = id.data;
    const recipe = await db.recipe.findUnique({ where: { id: recipeId }, select: { notes: {
      where: { ownerId: session.ownerId }, select: { note: true },
    } } });
    if (!recipe) return reply.code(404).send({ error: 'Recipe not found' });
    return reply.header('Cache-Control', 'no-store').send({ note: recipe.notes[0]?.note ?? '' });
  });

  app.put('/me/recipe-notes/:id', async (request, reply) => {
    const session = await requireSession(request, reply, db);
    if (!session) return;
    const id = uuid.safeParse((request.params as { id: string }).id);
    const body = noteBody.safeParse(request.body);
    if (!id.success || !body.success) return reply.code(400).send({ error: 'Invalid recipe note' });
    const { ownerId } = session;
    const recipeId = id.data;
    const note = body.data.note.trim() ? body.data.note : '';
    try {
      const found = await db.$transaction(async tx => {
        await lockOwner(tx, ownerId);
        if (!await tx.recipe.findUnique({ where: { id: recipeId }, select: { id: true } })) return false;
        if (!note) await tx.recipeNote.deleteMany({ where: { ownerId, recipeId } });
        else await tx.recipeNote.upsert({
          where: { ownerId_recipeId: { ownerId, recipeId } },
          create: { ownerId, recipeId, note }, update: { note },
        });
        return true;
      });
      if (found) return reply.code(204).send();
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2003') throw error;
    }
    return reply.code(404).send({ error: 'Recipe not found' });
  });
}
