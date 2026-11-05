import type { Recipe } from './recipe-data';

export type CatalogSort = 'relevance' | 'popular' | 'rating' | 'prep' | 'time';
export type CatalogFilters = {
  query: string;
  category: string;
  difficulty: '' | 'Facile' | 'Moyen';
  maxTime: number | null;
  budget: '' | 'Bon marché' | 'Moyen' | 'Assez cher';
  sort: CatalogSort;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  query: '', category: 'Toutes les recettes', difficulty: '', maxTime: null, budget: '', sort: 'relevance'
};
export const CATALOG_SORTS: CatalogSort[] = ['relevance', 'popular', 'rating', 'prep', 'time'];

function textNormalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
}

export function parseCatalogQuery(search: string): CatalogFilters {
  const params = new URLSearchParams(search);
  const difficulty = params.get('difficulty');
  const budget = params.get('budget');
  const sort = params.get('sort');
  const time = params.get('maxTime');
  const maxTime = time !== null && /^(?:[1-9]\d{0,3})$/.test(time) && Number(time) <= 1440 ? Number(time) : null;
  const category = params.get('category');
  return {
    query: (params.get('q') ?? '').slice(0, 150),
    category: ['Entrées','Plats','Desserts','Petit-déjeuner'].includes(category ?? '') ? category! : 'Toutes les recettes',
    difficulty: difficulty === 'Facile' || difficulty === 'Moyen' ? difficulty : '',
    budget: budget === 'Bon marché' || budget === 'Moyen' || budget === 'Assez cher' ? budget : '',
    maxTime,
    sort: CATALOG_SORTS.includes(sort as CatalogSort) ? sort as CatalogSort : 'relevance'
  };
}

export function serializeCatalogQuery(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.category !== 'Toutes les recettes') params.set('category', filters.category);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.maxTime !== null) params.set('maxTime', String(filters.maxTime));
  if (filters.budget) params.set('budget', filters.budget);
  if (filters.sort !== 'relevance') params.set('sort', filters.sort);
  return params.toString() ? `?${params.toString()}` : '';
}

export function filterCatalogRecipes(
  recipes: readonly Recipe[],
  preparation: Record<number, { prep: number; cook: number; rest: number; budget: string }>,
  filters: CatalogFilters
): Recipe[] {
  const query = textNormalized(filters.query.trim());
  const matches = recipes.filter(recipe => {
    const meta = preparation[recipe.id];
    const duration = meta ? meta.prep + meta.cook + meta.rest : recipe.time;
    const searchable = textNormalized([recipe.title,recipe.description,recipe.category,...recipe.ingredients].join(' '));
    return (!query || searchable.includes(query))
      && (filters.category === 'Toutes les recettes' || recipe.category === filters.category)
      && (!filters.difficulty || recipe.difficulty === filters.difficulty)
      && (filters.maxTime === null || duration <= filters.maxTime)
      && (!filters.budget || meta?.budget === filters.budget);
  });
  if (filters.sort === 'relevance') return matches;
  return matches.sort((a,b) => {
    const pa = preparation[a.id], pb = preparation[b.id];
    if (filters.sort === 'popular') return b.reviews - a.reviews || b.rating - a.rating;
    if (filters.sort === 'rating') return b.rating - a.rating || b.reviews - a.reviews;
    if (filters.sort === 'prep') return (pa?.prep ?? a.time) - (pb?.prep ?? b.time);
    return (pa ? pa.prep + pa.cook + pa.rest : a.time) - (pb ? pb.prep + pb.cook + pb.rest : b.time);
  });
}
