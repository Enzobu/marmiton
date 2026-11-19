import type { Prisma, PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSession } from './auth.js';
import { ingredientWeight } from './nutrition-weight.js';
import { ingredientNameKey } from './ingredient-icons.js';
import { nutrients, type Macros, type NutritionOverride, type NutritionSummary } from './nutrition-types.js';

const maxGrams = 100_000_000;
export const nutritionOverrideSchema = z.object({
  foodCode: z.number().int().positive().max(999999).optional(),
  grams: z.number().finite().nonnegative().max(maxGrams).optional(),
  per100g: z.object({
    kcal: z.number().finite().min(0).max(1000),
    protein: z.number().finite().min(0).max(100),
    carbs: z.number().finite().min(0).max(100),
    fat: z.number().finite().min(0).max(100),
  }).strict().optional(),
  remember: z.boolean().optional(),
}).strict().refine(value => !(value.foodCode && value.per100g) && (!value.remember || !!value.foodCode));

const source = 'Ciqual 2025 — Anses et références fabricant';
type NutritionDb = Pick<PrismaClient, 'nutritionAlias' | 'nutritionFood'>;
type Food = Macros & { code: number };
type Ingredient = {
  name: string;
  quantity: { toNumber(): number } | null;
  unit: string | null;
  nutrition: Prisma.JsonValue;
};

export function readNutritionOverride(value: Prisma.JsonValue): NutritionOverride | null {
  return nutritionOverrideSchema.safeParse(value).data ?? null;
}

export function summarizeNutrition(rows: { name: string; grams: number | null; macros: Macros | null }[], servings: number): NutritionSummary {
  const total: Macros = { kcal: null, protein: null, carbs: null, fat: null };
  const missing: NutritionSummary['missing'] = [];
  for (const [position, { name, grams, macros }] of rows.entries()) {
    if (grams === 0 || (macros && nutrients.every(key => macros[key] === 0))) {
      for (const nutrient of nutrients) total[nutrient] ??= 0;
      continue;
    }
    const reason = grams === null ? 'weight' : !macros ? 'food' : nutrients.some(key => macros[key] === null) ? 'values' : null;
    if (reason) missing.push({ position, name, reason });
    if (grams === null || !macros) continue;
    for (const nutrient of nutrients) {
      const value = macros[nutrient];
      if (value !== null) total[nutrient] = (total[nutrient] ?? 0) + value * grams / 100;
    }
  }
  const divide = (key: keyof Macros) => total[key] === null ? null : total[key] / servings;
  return { total, perPortion: { kcal: divide('kcal'), protein: divide('protein'), carbs: divide('carbs'), fat: divide('fat') }, missing, source };
}

export async function recipeNutrition(db: NutritionDb, ingredients: Ingredient[], servings: number) {
  const rows = ingredients.map(item => ({
    item, key: ingredientNameKey(item.name), correction: readNutritionOverride(item.nutrition),
  }));
  const keys = [...new Set(rows.map(row => row.key))];
  const aliases = await db.nutritionAlias.findMany({ where: { nameKey: { in: keys } } });
  const byAlias = new Map(aliases.map(alias => [alias.nameKey, alias.foodCode]));
  const codes = rows.flatMap(({ key, correction }) => correction?.foodCode ?? byAlias.get(key) ?? []);
  const foods = await db.nutritionFood.findMany({ where: {
    OR: [{ code: { in: codes } }, { nameKey: { in: keys } }],
  } });
  const byCode = new Map<number, Food>(foods.map(food => [food.code, food]));
  const byName = new Map<string, Food | null>();
  for (const food of foods) byName.set(food.nameKey, byName.has(food.nameKey) ? null : food);
  return summarizeNutrition(rows.map(({ item, key, correction }) => {
    const code = correction?.foodCode ?? byAlias.get(key);
    return {
      name: item.name,
      grams: ingredientWeight(item.name, item.quantity?.toNumber() ?? null, item.unit, correction?.grams),
      macros: correction?.per100g ?? (code ? byCode.get(code) : byName.get(key)) ?? null,
    };
  }), servings);
}

export function registerNutrition(app: FastifyInstance, db: PrismaClient) {
  app.get('/nutrition/foods', async (request, reply) => {
    if (!await requireSession(request, reply, db)) return;
    const parsed = z.object({
      q: z.string().trim().max(160).default(''),
      selected: z.coerce.number().int().positive().max(999999).optional(),
      ingredient: z.string().trim().max(160).optional(),
    }).strict().safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid food search' });
    const { q, selected, ingredient } = parsed.data;
    const key = ingredientNameKey(q);
    const words = [...new Set(key.split(' ').filter(Boolean).map(word => word.length > 3 ? word.replace(/s$/, '') : word))].slice(0, 8);
    const ingredientKey = ingredientNameKey(ingredient ?? q);
    const alias = ingredientKey ? await db.nutritionAlias.findUnique({ where: { nameKey: ingredientKey } }) : null;
    const suggestionCode = selected ?? alias?.foodCode;
    const terms = words.map(word => ({ nameKey: { contains: word } }));
    const [preferred, other, match] = await Promise.all([
      words.length ? db.nutritionFood.findMany({
        where: { nameKey: { startsWith: words[0] }, AND: terms },
        orderBy: [{ nameKey: 'asc' }, { code: 'asc' }], take: 15,
        select: { code: true, name: true },
      }) : [],
      words.length ? db.nutritionFood.findMany({
        where: { AND: terms, NOT: { nameKey: { startsWith: words[0] } } },
        orderBy: [{ nameKey: 'asc' }, { code: 'asc' }], take: 15,
        select: { code: true, name: true },
      }) : [],
      suggestionCode ? db.nutritionFood.findUnique({ where: { code: suggestionCode }, select: { code: true, name: true } }) :
        ingredientKey ? db.nutritionFood.findMany({ where: { nameKey: ingredientKey }, take: 2, select: { code: true, name: true } }).then(foods => foods.length === 1 ? foods[0] : null) : null,
    ]);
    return { results: [...preferred, ...other].slice(0, 15), match };
  });
}
