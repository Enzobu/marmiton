import { normalizeIngredient } from './local-planning.ts';
import type { Recipe } from './recipe-data';

export function pantryMatches<T extends Pick<Recipe, 'ingredients' | 'title'>>(recipes: T[], input: string) {
  const available = new Set(input.split(/[,;\n]/).map(normalizeIngredient).filter(Boolean));
  if (!available.size) return [];
  return recipes.flatMap(recipe => {
    const ingredients = new Map(recipe.ingredients.map(name => [normalizeIngredient(name), name]));
    const missing = [...ingredients].filter(([key]) => !available.has(key)).map(([, name]) => name);
    return missing.length < ingredients.size && missing.length <= 2 ? [{ recipe, missing }] : [];
  }).sort((a, b) => a.missing.length - b.missing.length || a.recipe.title.localeCompare(b.recipe.title, 'fr'));
}
