import type { Prisma, PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSession } from './auth.js';
import { inferIngredientIcon } from './ingredient-icons.js';
import { readNutritionOverride, recipeNutrition } from './nutrition.js';
import { RECIPE_DIFFICULTIES } from './recipe-json.js';

const querySchema = z.object({
  q: z.string().trim().max(150).optional(),
  category: z.enum(['Entrées', 'Plats', 'Desserts', 'Petit-déjeuner']).optional(),
  difficulty: z.enum(RECIPE_DIFFICULTIES).optional(),
  budget: z.enum(['Bon marché', 'Moyen', 'Assez cher']).optional(),
  maxTime: z.coerce.number().int().min(1).max(1440).optional(),
  sort: z.enum(['relevance', 'popular', 'rating', 'prep', 'time']).default('relevance'),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
}).strict();

const sortOrder: Record<z.infer<typeof querySchema>['sort'], Prisma.RecipeOrderByWithRelationInput[]> = {
  relevance: [{ createdAt: 'desc' }],
  popular: [{ reviews: 'desc' }, { rating: 'desc' }],
  rating: [{ rating: 'desc' }, { reviews: 'desc' }],
  prep: [{ prepMinutes: 'asc' }],
  time: [{ totalMinutes: 'asc' }],
};

export const recipeRelations = {
  ingredients: { orderBy: { position: 'asc' } },
  steps: { orderBy: { position: 'asc' } },
} satisfies Prisma.RecipeInclude;

export function recipeResponse(recipe: Prisma.RecipeGetPayload<{ include: typeof recipeRelations }>) {
  return {
    id: recipe.id, title: recipe.title, description: recipe.description, category: recipe.category,
    difficulty: recipe.difficulty, time: recipe.totalMinutes, image: recipe.imagePath,
    rating: recipe.rating, reviews: recipe.reviews, badge: recipe.badge, servings: recipe.servings,
    isPublic: recipe.isPublic,
    ingredients: recipe.ingredients.map(item => item.name),
    steps: recipe.steps.map(step => step.content),
    quantities: recipe.ingredients.map(item => ({
      name: item.name, amount: item.quantity?.toNumber() ?? null, unit: item.unit,
      icon: item.icon === 'other' ? inferIngredientIcon(item.name) : item.icon,
      nutrition: readNutritionOverride(item.nutrition),
    })),
    preparation: {
      prep: recipe.prepMinutes, cook: recipe.cookMinutes, rest: recipe.restMinutes,
      budget: recipe.budget, utensils: recipe.utensils, servings: recipe.servings,
    },
  };
}

export function registerCatalog(app: FastifyInstance, db: PrismaClient) {
  app.get('/recipes', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid catalogue parameters' });

    const { q, category, difficulty, budget, maxTime, sort, page, limit } = parsed.data;
    const where: Prisma.RecipeWhereInput = {
      isPublic: true, category, difficulty, budget,
      totalMinutes: maxTime === undefined ? undefined : { lte: maxTime },
    };
    if (q) {
      const contains = q.replace(/[\\%_]/g, '\\$&');
      where.OR = [
        { title: { contains } }, { description: { contains } }, { category: { contains } },
        { ingredients: { some: { name: { contains } } } },
      ];
    }
    const [total, recipes] = await db.$transaction([
      db.recipe.count({ where }),
      db.recipe.findMany({ where, orderBy: [...sortOrder[sort], { id: 'asc' }], skip: (page - 1) * limit, take: limit, include: recipeRelations }),
    ]);
    return { items: recipes.map(recipeResponse), page, limit, total };
  });

  app.get('/recipes/:id', async (request, reply) => {
    const id = z.string().uuid().safeParse((request.params as { id: string }).id);
    if (!id.success) return reply.code(400).send({ error: 'Invalid recipe UUID' });
    const recipe = await db.recipe.findFirst({ where: { id: id.data, isPublic: true }, include: recipeRelations });
    if (!recipe && request.headers.authorization) {
      if (!await requireSession(request, reply, db)) return;
      const owned = await db.recipe.findUnique({ where: { id: id.data }, include: recipeRelations });
      if (owned) return { ...recipeResponse(owned), nutrition: await recipeNutrition(db, owned.ingredients, owned.servings) };
    }
    if (!recipe) return reply.code(404).send({ error: 'Recipe not found' });
    return { ...recipeResponse(recipe), nutrition: await recipeNutrition(db, recipe.ingredients, recipe.servings) };
  });
}
