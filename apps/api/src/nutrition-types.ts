export const nutrients = ['kcal', 'protein', 'carbs', 'fat'] as const;
export type Nutrient = typeof nutrients[number];
export type Macros = Record<Nutrient, number | null>;
export type NutritionOverride = {
  foodCode?: number;
  grams?: number;
  per100g?: Record<Nutrient, number>;
  remember?: boolean;
};
export type FoodChoice = { code: number; name: string };
export type NutritionSummary = {
  total: Macros;
  perPortion: Macros;
  missing: { position: number; name: string; reason: 'food' | 'weight' | 'values' }[];
  source: string;
};
