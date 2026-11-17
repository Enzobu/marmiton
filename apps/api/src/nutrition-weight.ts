import { ingredientNameKey } from './ingredient-icons.js';

const weightUnits = new Map([
  ['g', 1], ['gramme', 1], ['grammes', 1], ['kg', 1000], ['kilogramme', 1000], ['kilogrammes', 1000],
  ['mg', 0.001],
]);

// Values are editable estimates of the edible weight, excluding the shell.
const eggPieceGrams = 50;
const eggNames = new Set(['oeuf', 'oeufs', 'oeuf entier', 'oeufs entiers', 'oeuf de poule', 'oeufs de poule']);

export function ingredientWeight(name: string, quantity: number | null, unit: string | null, override?: number) {
  if (override !== undefined) return override;
  if (quantity === null) return null;
  if (quantity === 0) return 0;
  const unitKey = ingredientNameKey(unit ?? '');
  const factor = weightUnits.get(unitKey);
  if (factor !== undefined) return quantity * factor;
  if (['', 'piece', 'pieces', 'piece s'].includes(unitKey) && eggNames.has(ingredientNameKey(name))) {
    return eggPieceGrams * quantity;
  }
  return null;
}
