import { ingredientNameKey } from './ingredient-icons.js';

const weightUnits = new Map([
  ['g', 1], ['gramme', 1], ['grammes', 1], ['kg', 1000], ['kilogramme', 1000], ['kilogrammes', 1000],
  ['mg', 0.001],
]);

// Editable estimates in grams of edible food per piece.
const pieceWeights = new Map([
  ['oeuf', 50], ['oeufs', 50], ['oeuf entier', 50], ['oeufs entiers', 50],
  ['oeuf de poule', 50], ['oeufs de poule', 50],
  ['oignon', 100], ['oignons', 100], ['oignon rouge', 100], ['oignons rouges', 100],
  ['oignon jaune', 100], ['oignons jaunes', 100],
  ['carotte', 70], ['carottes', 70],
  ['gros oignon', 150], ['gros oignons', 150],
  ['gousse d ail', 3], ['gousses d ail', 3], ['tete d ail', 30], ['tetes d ail', 30],
  ['cube de bouillon de boeuf', 10], ['cubes de bouillon de boeuf', 10],
]);
const waterBasedLiquids = new Set(['eau', 'eau du robinet', 'bouillon de volaille', 'bouillon de boeuf']);

export function ingredientWeight(name: string, quantity: number | null, unit: string | null, override?: number) {
  if (override !== undefined) return override;
  if (quantity === null) return null;
  if (quantity === 0) return 0;
  const unitKey = ingredientNameKey(unit ?? '');
  const factor = weightUnits.get(unitKey);
  if (factor !== undefined) return quantity * factor;
  const foodKey = ingredientNameKey(name);
  if (['', 'piece', 'pieces', 'piece s'].includes(unitKey)) {
    const grams = pieceWeights.get(foodKey);
    return grams === undefined ? null : grams * quantity;
  }
  if (waterBasedLiquids.has(foodKey)) {
    if (unitKey === 'ml') return quantity;
    if (unitKey === 'cl') return quantity * 10;
    if (unitKey === 'l') return quantity * 1000;
  }
  return null;
}
