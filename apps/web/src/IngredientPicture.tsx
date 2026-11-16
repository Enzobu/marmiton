import { normalizeIngredient } from './normalize-ingredient';
import type { Ingredient } from './recipe-data';

const ingredientPictures = [
  [/\bharicots?\b/, 'M15 4c-5-2-10 2-11 7-1 4 2 7 6 6 3-1 3-4 5-5 4-3 4-7 0-8Z M9 8c-2 1-3 3-2 5 M25 14c-5-2-10 2-12 7-2 4 1 8 5 7 3-1 4-4 6-5 4-2 5-7 1-9Z M20 18c-2 1-4 3-4 5'],
  [/\boignons?\b/, 'M14 9c0-2 0-4-2-6m4 6V3m2 6c0-2 0-4 2-6 M14 9c-1 4-8 5-8 12a10 8 0 0 0 20 0c0-7-7-8-8-12Zm2 0c-2 4-5 7-5 12 0 4 2 8 5 8s5-4 5-8c0-5-3-8-5-12Z'],
  [/\bcarottes?\b/, 'M21 11c-3-3-7-3-9 0L4 27c-.4.8.4 1.6 1.2 1.2l16-8c3-2 3-6 0-9Z M20 10c0-4 1-6 3-7m-1 9 6-7m-5 9 6-1M10 15l4 3m-7 3 3 2m7-4 2 2'],
  [/\bails?\b|\baulx\b/, 'M14 4h4v6c0 3 8 5 8 12 0 4-4 6-10 6S6 26 6 22c0-7 8-9 8-12V4Z M14 11c0 5-4 7-4 11 0 3 2 5 4 6m4-17c0 5 4 7 4 11 0 3-2 5-4 6m-2-15v14m-4 2 1-2m7 2-1-2'],
  [/\bbouquets? garnis?\b|\b(?:thym|romarin|persil|laurier|coriandre|basilic|ciboulette|origan)\b/, 'M10 29c5-5 8-11 11-20M14 24c-2-4-5-7-9-8m11 4c4-2 7-4 11-5m-8 0c-4-2-6-5-7-9 M21 10c-1-4 1-7 5-8 0 4-1 7-5 8Zm-8 1c-4-1-6-3-6-6 3 0 5 2 6 6Zm-4 8c-4 0-6-2-7-5 4 0 6 2 7 5Zm14-2c0-3 3-5 7-5-1 4-3 5-7 5Zm-12 6 5 3'],
  [/\bpommes?\b(?!\s+de\s+terre\b)/, 'M16 9c-9-4-13 1-12 8 1 7 9 10 12 10s11-3 12-10c1-7-3-12-12-8Zm0 1c-3-6-1-8 2-8'],
] as const;

const familyPictures: Record<Ingredient['icon'], string> = {
  vegetable: 'M16 28V15m0 3C9 18 5 14 5 7c6 0 10 3 11 8 1-7 5-11 12-11 0 7-4 12-12 12M7 28h18',
  meat: 'M8 24c-4-4-2-10 3-15s12-5 15-1c4 4 1 11-4 15s-10 5-14 1Z M22 14a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z',
  dairy: 'M10 7h12l2 20H8l2-20ZM11 7V3h10v4M9 14h14M13 20h6',
  grain: 'M16 28V4M16 9c-4 0-7-2-7-6m7 12c-5 0-9-3-9-7m9 13c-5 0-9-3-9-7m9-5c4 0 7-2 7-6m-7 12c5 0 9-3 9-7m-9 13c5 0 9-3 9-7',
  spice: 'M10 10h12l2 15a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3l2-15Zm-1 0V7a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3H9Zm2 9h10M13 6h.1m2.9 0h.1m2.9 0h.1',
  other: 'M13 3h6v5l4 6v11c0 2-1 3-3 3H12c-2 0-3-1-3-3V14l4-6V3ZM9 17h14',
};

export function IngredientPicture({ ingredient }: { ingredient: Pick<Ingredient, 'name' | 'icon'> }) {
  const name = normalizeIngredient(ingredient.name);
  const picture = ingredientPictures.find(([pattern]) => pattern.test(name))?.[1] ?? familyPictures[ingredient.icon];
  return <span className={`ingredient-picture ingredient-${ingredient.icon}`} aria-hidden="true">
    <svg width="31" height="31" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <path d={picture}/>
    </svg>
  </span>;
}
