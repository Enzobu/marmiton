import { maxImageBytes } from '../../api/src/image-limits.ts';
import type { RecipeDifficulty } from './recipe-json';

export type RecipeDraft = {
  title: string;
  description: string;
  category: string;
  difficulty: RecipeDifficulty;
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
export const MAX_IMAGE_MB = maxImageBytes / 1_000_000;
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
  if (!ACCEPTED_RECIPE_IMAGE_TYPES.some(type => type === file.type)) return 'Sélectionnez une image JPG, PNG ou WebP.';
  if (file.size > maxImageBytes) return `La photo ne doit pas dépasser ${MAX_IMAGE_MB} Mo.`;
  return null;
}
