import { normalizeIngredient } from './normalize-ingredient';
import type { Ingredient } from './recipe-data';

const ingredientPictures = [
  [/\bail en poudre\b/, 'M10 10h12l2 15a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3Zm-1 0V5h14v5M9 19h14m-10 4h6'],
  [/\bpommes? de terre\b|\bpatates?\b/, 'M5 11c3-5 9-7 15-5 5 2 9 6 8 11-1 6-7 10-13 9C8 26 2 20 4 14Zm5 2h1m7-3h1m3 8h1m-10 3h1'],
  [/\btomates?\b/, 'M11 10C5 9 3 15 5 20s6 8 11 8 10-4 12-9-2-10-7-9M16 11V4m0 7-6-3 2 6 4-3 4 3 2-6Z'],
  [/\bepinards?\b/, 'M6 27c2-5 5-9 10-14m-7 9C3 16 8 7 25 4c2 10-3 22-16 18Zm4-5V12m4 1 5-1'],
  [/\bpetits? pois\b/, 'M4 24C6 13 17 8 28 7c-1 10-9 18-20 19l-4-2Zm22-15 3-4M5 24l-2 4M13 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm7-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'],
  [/\bchampignons?\b/, 'M4 17a12 12 0 0 1 24 0Zm9 0-2 9c0 2 10 2 10 0l-2-9M9 13l2-2m8 0 2 2'],
  [/\bcourgettes?\b/, 'M6 18 22 7c4-3 8 2 4 6L13 27c-5 5-12-4-7-9Zm16-11 1-4 4 1v3M11 21l9-8'],
  [/\bframboises?\b/, 'M16 7c1-3 3-4 6-4m-6 4c-3 0-5-1-6-3m6 3v2M12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-12 7a4 4 0 0 0 4 7m12-7a4 4 0 0 1-4 7m-4-7a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-4 8a4 4 0 0 0 8 0'],
  [/\b(?:canards?|poulets?|dindes?|volailles?)\b/, 'M13 20c-6 0-10-3-10-8 0-6 5-9 10-8 5 1 8 5 7 10l5 5c3-1 5 2 3 4 2 3-2 5-4 3-2 2-5-1-4-3l-5-5Zm-6-8c0-3 3-5 6-4'],
  [/\bsaucisses?\b/, 'M5 22c7 2 15-3 17-13 1-4 7-3 7 1-1 12-11 20-23 19-4 0-5-6-1-7Zm1 0-3-3m25-9 1-5M20 12l5 2m-10 4 4 3m-10 1 1 5'],
  [/\b(?:lardons?|poitrine de porc|bacon)\b/, 'm5 13 17-8 7 5v10L12 28l-7-5Zm0 0 7 5 17-8m-17 8v10m0-5 17-8M18 11l4-2'],
  [/\bjambons?\b/, 'M5 11c5-6 15-6 21-1 4 4 2 9-3 13l-4 3H9c-5 0-7-3-6-6l2-9Zm2 4c5-5 14-6 19-2m-16 9h8m2-4h4'],
  [/\bcrevettes?\b/, 'M22 8c-6-4-16-1-18 6-2 8 6 15 13 12l5-3-4-4-3 2c-3 1-6-2-4-5 1-2 4-2 7-1l4-7Zm0 0 4-3m-4 6 7-1M8 10l4 5m-8 2 6 1m-3 6 5-3m2 5 1-5'],
  [/\b(?:thon|saumons?|sardines?|merlus?|cabillauds?)\b/, 'M4 16c4-8 12-10 19-3l6-5v16l-6-5C16 26 8 24 4 16Zm10-6 3-5 3 5m-4 13 3 4 2-5M10 15h.2m4-2c2 2 2 4 0 6'],
  [/\bbeurres?\b(?! de cacahuetes?\b)/, 'm4 15 13-7 11 5v9l-13 6-11-5Zm0 0 11 5 13-7m-13 7v8m5-16 4 2'],
  [/\b(?:cremes?|bechamels?)\b/, 'M4 14h24c0 8-5 13-12 13S4 22 4 14Zm2-4h20M11 6c1-2 3-2 5 0s4 2 5 0m-14 8h18'],
  [/\byaourts?\b/, 'M7 10h18l-3 16H10Zm-2 0V6h22v4ZM13 18a3 3 0 0 0 6 0m-4-2h2'],
  [/\bmozzarellas?\b/, 'M16 5C9 5 4 10 4 17c0 6 5 10 12 10s12-4 12-10C28 10 23 5 16 5Zm-5 7c-2 1-3 3-3 5m11 6c2-1 4-2 5-5'],
  [/\b(?:fromages?|parmesans?|emmentals?)\b/, 'm4 16 18-10 6 9v11H4Zm0 0h24m-16 5h.2m5-8h.2m6 9h.2'],
  [/\boeufs?\b/, 'M16 4c-5 0-11 9-11 15a11 9 0 0 0 22 0C27 13 21 4 16 4ZM10 19c0 3 2 5 5 5'],
  [/\bfarines?\b/, 'M11 9 8 4h16l-3 5c0 4 7 7 7 14 0 3-3 5-6 5H10c-3 0-6-2-6-5 0-7 7-10 7-14Zm0 0h10m-5 7v8m-4-7 4 3 4-3'],
  [/\bpates? (?:feuilletees?|brisees?|sablees?)\b/, 'M6 16 16 5l10 6-10 11Zm0 0v7l10 5 10-10v-7m-10 11v6m-7-13 9-9m-4 13 9-10'],
  [/\b(?:pates?|nouilles?|lasagnes?)\b/, 'M5 6c8-5 8 7 0 7s0 12 7 7 0-11 7-14 10 4 4 9-8 9-2 12m-3-15c-4 4-9 0-5-6m14 10c-7 3-7 8 0 10'],
  [/\b(?:riz|semoule|quinoa)\b/, 'M4 15h24c0 8-5 13-12 13S4 23 4 15ZM8 13l3-5m3 5 3-8m3 8 3-5m-1 5 4-2'],
  [/\b(?:avoine|flocons?)\b/, 'M5 17c0-5 7-10 11-8 1 4-2 9-7 11-2 1-4-1-4-3Zm10 6c0-5 7-10 11-8 1 4-2 9-7 11-2 1-4-1-4-3Zm4-13 4-4h4M8 17l4-4m6 10 4-4'],
  [/\bpains?\b/, 'M7 27V13C2 10 6 5 11 5h10c5 0 9 5 4 8v14Zm4-4V13m0-2c2-2 8-2 10 0v12'],
  [/\b(?:sucres?|cassonades?)\b/, 'm5 16 11-6 11 6v9l-11 5-11-5Zm0 0 11 5 11-5m-11 5v9m-3-23 3-4 3 4'],
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
  const useFamilyPicture = /^(?:bouillons?|fonds?|fumets?|graisses?|huiles?)\b|^lait (?:de |d')(?:amandes?|avoine|coco|soja)\b/.test(name);
  const specificPicture = useFamilyPicture ? undefined : ingredientPictures.find(([pattern]) => pattern.test(name))?.[1];
  const picture = specificPicture ?? familyPictures[ingredient.icon];
  return <span className={`ingredient-picture ingredient-${ingredient.icon}`} aria-hidden="true">
    <svg width="31" height="31" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <path d={picture}/>
    </svg>
  </span>;
}
