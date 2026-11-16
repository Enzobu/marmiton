import { PrismaClient } from '@prisma/client';
import { recipes, ingredientQuantities, recipePreparation, BASE_SERVINGS } from '../../web/src/recipe-data.js';

const db = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Development seed requires a non-production environment');
  for (const recipe of recipes) {
    const fixtureId = Number(recipe.id);
    const id = `00000000-0000-4000-8000-${String(fixtureId).padStart(12, '0')}`;
    const meta = recipePreparation[fixtureId];
    await db.recipe.upsert({
      where: { id },
      update: {},
      create: {
        id, title: recipe.title, description: recipe.description, category: recipe.category, difficulty: recipe.difficulty,
        budget: meta.budget, servings: meta.servings ?? BASE_SERVINGS, prepMinutes: meta.prep, cookMinutes: meta.cook,
        restMinutes: meta.rest, totalMinutes: meta.prep + meta.cook + meta.rest, imagePath: recipe.image,
        utensils: meta.utensils, rating: recipe.rating, reviews: recipe.reviews, badge: recipe.badge,
        ingredients: { create: ingredientQuantities[fixtureId].map((item, position) => ({
          position, name: item.name, quantity: item.amount, unit: item.unit, icon: item.icon,
        })) },
        steps: { create: recipe.steps.map((content, position) => ({ content, position })) },
      },
    });
  }
}

try { await main(); } finally { await db.$disconnect(); }
