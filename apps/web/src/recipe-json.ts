export const RECIPE_JSON_VERSION = 1 as const;

export type RecipeJson = {
  schemaVersion: typeof RECIPE_JSON_VERSION;
  title: string;
  description: string;
  category: 'Entrées' | 'Plats' | 'Desserts' | 'Petit-déjeuner';
  difficulty: 'Facile' | 'Moyen';
  servings: number;
  times: { preparation: number; cooking: number; rest: number };
  budget: 'Bon marché' | 'Moyen' | 'Assez cher';
  ingredients: { name: string; quantity: number; unit: string }[];
  utensils: string[];
  steps: string[];
  imageUrl: string | null;
};

export const RECIPE_JSON_EXAMPLE: RecipeJson = {
  schemaVersion: 1,
  title: 'Lasagnes maison',
  description: 'Une recette généreuse à partager.',
  category: 'Plats',
  difficulty: 'Facile',
  servings: 4,
  times: { preparation: 30, cooking: 45, rest: 0 },
  budget: 'Moyen',
  ingredients: [
    { name: 'Viande hachée', quantity: 500, unit: 'g' },
    { name: 'Sauce tomate', quantity: 600, unit: 'g' }
  ],
  utensils: ['Plat à gratin', 'Four'],
  steps: ['Préparer la sauce.', 'Assembler les couches.', 'Enfourner.'],
  imageUrl: null
};

export type RecipeJsonValidation = { ok: true; value: RecipeJson } | { ok: false; error: string };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function stringField(value: unknown, path: string, max: number): string | { error: string } {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    return { error: `${path} : texte obligatoire (1 à ${max} caractères).` };
  }
  return value;
}
function numberField(value: unknown, path: string, min: number, max: number, integer = false): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    return `${path} : nombre ${integer ? 'entier ' : ''}entre ${min} et ${max} requis.`;
  }
  return null;
}

export function validateRecipeJson(value: unknown): RecipeJsonValidation {
  if (!record(value)) return { ok: false, error: 'La racine du JSON doit être un objet.' };
  if (value.schemaVersion !== RECIPE_JSON_VERSION) return { ok: false, error: `schemaVersion : seule la version ${RECIPE_JSON_VERSION} est prise en charge.` };
  if ('id' in value || 'uuid' in value || 'authorId' in value) return { ok: false, error: "Ne fournis pas d'identifiant : l'application le génère lors de l'enregistrement." };
  const allowed = new Set(['schemaVersion','title','description','category','difficulty','servings','times','budget','ingredients','utensils','steps','imageUrl']);
  const extra = Object.keys(value).find(key => !allowed.has(key));
  if (extra) return { ok: false, error: `Champ inconnu : ${extra}.` };

  for (const [path, max] of [['title',120],['description',600]] as const) {
    const result = stringField(value[path], path, max);
    if (typeof result !== 'string') return { ok: false, error: result.error };
  }
  if (!['Entrées','Plats','Desserts','Petit-déjeuner'].includes(value.category as string)) return { ok: false, error: 'category : catégorie inconnue.' };
  if (!['Facile','Moyen'].includes(value.difficulty as string)) return { ok: false, error: 'difficulty : valeur attendue Facile ou Moyen.' };
  const servingsError = numberField(value.servings, 'servings', 1, 12, true);
  if (servingsError) return { ok: false, error: servingsError };
  if (!record(value.times)) return { ok: false, error: 'times : objet obligatoire.' };
  for (const field of ['preparation','cooking','rest'] as const) {
    const error = numberField(value.times[field], `times.${field}`, 0, 1440, true);
    if (error) return { ok: false, error };
  }
  if (!['Bon marché','Moyen','Assez cher'].includes(value.budget as string)) return { ok: false, error: 'budget : valeur inconnue.' };
  if (!Array.isArray(value.ingredients) || value.ingredients.length < 1 || value.ingredients.length > 60) return { ok: false, error: 'ingredients : entre 1 et 60 ingrédients requis.' };
  for (const [index, ingredient] of value.ingredients.entries()) {
    const path = `ingredients[${index}]`;
    if (!record(ingredient)) return { ok: false, error: `${path} : objet requis.` };
    const name = stringField(ingredient.name, `${path}.name`, 100);
    if (typeof name !== 'string') return { ok: false, error: name.error };
    const error = numberField(ingredient.quantity, `${path}.quantity`, 0, 1000000);
    if (error) return { ok: false, error };
    if (typeof ingredient.unit !== 'string' || ingredient.unit.length > 30) return { ok: false, error: `${path}.unit : chaîne de 30 caractères maximum.` };
  }
  if (!Array.isArray(value.utensils) || value.utensils.length > 20) return { ok: false, error: 'utensils : 20 ustensiles maximum.' };
  for (const [index, utensil] of value.utensils.entries()) {
    const checked = stringField(utensil, `utensils[${index}]`, 70);
    if (typeof checked !== 'string') return { ok: false, error: checked.error };
  }
  if (!Array.isArray(value.steps) || value.steps.length < 1 || value.steps.length > 60) return { ok: false, error: 'steps : entre 1 et 60 étapes requises.' };
  for (const [index, step] of value.steps.entries()) {
    const checked = stringField(step, `steps[${index}]`, 1200);
    if (typeof checked !== 'string') return { ok: false, error: checked.error };
  }
  if (value.imageUrl !== null && (typeof value.imageUrl !== 'string' || value.imageUrl.length > 2048 || !/^https?:\/\//i.test(value.imageUrl))) return { ok: false, error: 'imageUrl : URL http(s) valide ou null requis.' };
  return { ok: true, value: value as RecipeJson };
}

export function parseRecipeJson(source: string): RecipeJsonValidation {
  if (source.length > 150_000) return { ok: false, error: 'Le JSON dépasse la taille maximale de 150 Ko.' };
  try { return validateRecipeJson(JSON.parse(source) as unknown); }
  catch { return { ok: false, error: 'JSON invalide : vérifie la syntaxe (guillemets, virgules et accolades).' }; }
}

export function recipeJsonFilename(title: string): string {
  const slug = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80).replace(/_+$/g, '');
  return `${slug || 'recette'}.json`;
}

export function stringifyRecipeJson(value: RecipeJson): string {
  return JSON.stringify(value, null, 2);
}
