import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { recipes, recipePreparation } from '../src/recipe-data.ts';
import { DEFAULT_CATALOG_FILTERS, filterCatalogRecipes, parseCatalogQuery, serializeCatalogQuery } from '../src/recipe-search.ts';
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');

test('Query parameters round-trip with accent-safe French values', () => {
  const values = { ...DEFAULT_CATALOG_FILTERS, query: 'crème', category: 'Desserts', difficulty: 'Facile', budget: 'Bon marché', maxTime: 45, sort: 'rating' };
  const parsed = parseCatalogQuery(serializeCatalogQuery(values));
  assert.deepEqual(parsed, values);
});
test('Unknown query values are safely ignored', () => {
  const parsed = parseCatalogQuery('?category=unknown&difficulty=HARD&maxTime=-4&sort=oops');
  assert.deepEqual(parsed, DEFAULT_CATALOG_FILTERS);
});
test('Filters combine category, time, difficulty and budget', () => {
  const found = filterCatalogRecipes(recipes, recipePreparation, { ...DEFAULT_CATALOG_FILTERS, category: 'Desserts', difficulty: 'Facile', maxTime: 30, budget: 'Bon marché' });
  assert.ok(found.length > 0);
  assert.ok(found.every(recipe => recipe.category === 'Desserts' && recipe.difficulty === 'Facile' && recipe.time <= 30 && recipePreparation[recipe.id].budget === 'Bon marché'));
});
test('Search ignores accents and includes ingredient names', () => {
  const found = filterCatalogRecipes(recipes, recipePreparation, { ...DEFAULT_CATALOG_FILTERS, query: 'creme' });
  assert.ok(found.some(recipe => recipe.title.toLowerCase().includes('champignons')));
});
test('Sorting by popularity and rating uses real seed metadata', () => {
  const popular = filterCatalogRecipes(recipes, recipePreparation, { ...DEFAULT_CATALOG_FILTERS, sort: 'popular' });
  assert.ok(popular.every((recipe,index) => index === 0 || popular[index-1].reviews >= recipe.reviews));
  const rated = filterCatalogRecipes(recipes, recipePreparation, { ...DEFAULT_CATALOG_FILTERS, sort: 'rating' });
  assert.ok(rated.every((recipe,index) => index === 0 || rated[index-1].rating >= recipe.rating));
});
test('Catalog UI binds filters and handles browser back navigation', () => {
  assert.match(main, /className="advanced-search-panel"/);
  assert.match(main, /serializeCatalogQuery\(catalogFilters\)/);
  assert.match(main, /window\.addEventListener\('popstate'/);
  assert.match(main, /setDifficultyFilter\(parsed.difficulty\)/);
});
