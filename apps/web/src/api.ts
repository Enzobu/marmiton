import type { Ingredient, Preparation, Recipe } from './recipe-data';

const apiBase = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '/api')).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`API request failed (${status})`);
  }
}

export function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(apiBase + path, options);
  if (!response.ok) throw new ApiError(response.status);
  return response.status === 204 ? undefined as T : response.json();
}

export type ApiRecipe = Omit<Recipe, 'image' | 'badge'> & {
  image: string | null;
  badge: string | null;
  quantities: Ingredient[];
  preparation: Preparation;
  isPublic: boolean;
};

export type CatalogPage = { items: ApiRecipe[]; page: number; limit: number; total: number };

export function fromApiRecipe({ image, badge, ...recipe }: ApiRecipe): Recipe {
  const imageUrl = image?.startsWith('/') && !image.startsWith('//') ? apiBase + image : image;
  return { ...recipe, privateImage: image?.startsWith('/media/') && !recipe.isPublic, image: imageUrl ?? '', badge: badge ?? undefined };
}

export async function privateImageUrl(url: string, token: string, signal: AbortSignal) {
  const response = await fetch(url, { headers: authHeaders(token), signal });
  if (!response.ok) throw new ApiError(response.status);
  return URL.createObjectURL(await response.blob());
}
