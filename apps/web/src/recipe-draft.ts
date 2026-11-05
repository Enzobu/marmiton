export type RecipeDraft = {
  title: string;
  description: string;
  category: string;
  difficulty: 'Facile' | 'Moyen';
  prep: number;
  cook: number;
  rest: number;
  servings: number;
  budget: string;
  utensils: string[];
  image: string;
  items: { id: number; name: string; amount: string; unit: string }[];
  steps: { id: number; value: string }[];
};

export const DRAFT_STORAGE_KEY = 'petitsplats.recipe.draft.v2';
export const MAX_RECIPE_IMAGE_SIZE = 2_000_000;
export const ACCEPTED_RECIPE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function readDraft(): RecipeDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== 'object' || !('title' in payload) || !('items' in payload) || !Array.isArray(payload.items) || !('steps' in payload) || !Array.isArray(payload.steps)) return null;
    return payload as RecipeDraft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: RecipeDraft): boolean {
  try {
    // A locally selected photo is deliberately excluded from the stored draft.
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, image: draft.image.startsWith('data:') ? '' : draft.image }));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft() {
  try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* Private browsing can restrict storage. */ }
}

export function validateRecipeImage(file: File): string | null {
  if (!ACCEPTED_RECIPE_IMAGE_TYPES.some(type => type === file.type)) return 'Choisis une image JPG, PNG ou WebP.';
  if (file.size > MAX_RECIPE_IMAGE_SIZE) return 'La photo ne doit pas dépasser 2 Mo.';
  return null;
}
