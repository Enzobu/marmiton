type IngredientIcon = 'vegetable' | 'meat' | 'dairy' | 'grain' | 'spice' | 'other';

export function ingredientNameKey(name: string) {
  return name.toLocaleLowerCase('fr').normalize('NFD').replace(/\p{Mark}/gu, '')
    .replaceAll('œ', 'oe').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// Classify preparations before looking at the ingredient used to make them.
const genericPreparations = new Set(['bouillon', 'fond', 'fumet', 'graisse', 'huile']);

const expressions = new Map<string, IngredientIcon>([
  ['pomme de terre', 'vegetable'], ['pommes de terre', 'vegetable'],
  ['pate feuilletee', 'grain'], ['pate brisee', 'grain'], ['pate sablee', 'grain'],
  ['mie de pain', 'grain'], ['pain de mie', 'grain'],
  ['lait de coco', 'other'], ['lait d amande', 'other'], ['lait d amandes', 'other'],
  ['lait de soja', 'other'], ['lait d avoine', 'other'],
  ['beurre de cacahuete', 'other'], ['beurre de cacahuetes', 'other'],
  ['petit pois', 'vegetable'], ['petits pois', 'vegetable'],
  ['bouquet garni', 'spice'], ['bouquets garnis', 'spice'],
  ['sucre vanille', 'grain'], ['sauce soja', 'other'],
]);

const keywords: Record<Exclude<IngredientIcon, 'other'>, readonly string[]> = {
  vegetable: ['ail', 'aubergine', 'avocat', 'banane', 'brocoli', 'carotte', 'champignon', 'chou', 'choux',
    'citron', 'concombre', 'courgette', 'echalote', 'epinard', 'fraise', 'framboise', 'haricot', 'lentille',
    'myrtille', 'navet', 'oignon', 'olive', 'orange', 'patate', 'peche', 'poire', 'poireau',
    'poireaux', 'poivron', 'pomme', 'potiron', 'salade', 'tomate'],
  meat: ['agneau', 'boeuf', 'canard', 'crevette', 'dinde', 'jambon', 'lardon', 'lieu', 'merlu', 'poulet', 'porc',
    'sardine', 'saucisse', 'saumon', 'thon', 'veau', 'viande', 'volaille'],
  dairy: ['bechamel', 'beurre', 'creme', 'emmental', 'fromage', 'lait', 'mascarpone', 'mozzarella',
    'oeuf', 'parmesan', 'ricotta', 'yaourt'],
  grain: ['avoine', 'ble', 'boulgour', 'cassonade', 'chapelure', 'farine', 'fecule', 'lasagne', 'mais', 'nouille',
    'pain', 'pate', 'quinoa', 'riz', 'semoule', 'sucre'],
  spice: ['basilic', 'cannelle', 'ciboulette', 'coriandre', 'cumin', 'curcuma', 'curry', 'gingembre',
    'laurier', 'muscade', 'origan', 'paprika', 'persil', 'piment', 'poivre', 'romarin', 'safran', 'sel', 'thym', 'vanille'],
};

const iconsByWord = new Map<string, IngredientIcon>();
for (const [icon, words] of Object.entries(keywords) as [Exclude<IngredientIcon, 'other'>, readonly string[]][]) {
  for (const word of words) iconsByWord.set(word, icon);
}

function exactKeyword(word: string) {
  return iconsByWord.get(word) ?? (word.endsWith('s') ? iconsByWord.get(word.slice(0, -1)) : undefined);
}

function differsByOneEdit(word: string, candidate: string) {
  const lengthDifference = word.length - candidate.length;
  if (Math.abs(lengthDifference) > 1) return false;
  let index = 0;
  while (index < word.length && word[index] === candidate[index]) index++;
  if (lengthDifference === 1) return word.slice(index + 1) === candidate.slice(index);
  if (lengthDifference === -1) return word.slice(index) === candidate.slice(index + 1);
  if (index === word.length) return false;
  return word.slice(index + 1) === candidate.slice(index + 1) ||
    (word[index] === candidate[index + 1] && word[index + 1] === candidate[index] &&
      word.slice(index + 2) === candidate.slice(index + 2));
}

const preparationWords = new Set(['frais', 'fraiche', 'fraiches', 'seche', 'seches', 'moulu', 'moulue', 'moulus', 'moulues', 'entier', 'entiere']);
const longKeywords = [...iconsByWord.keys()].filter(word => word.length >= 5);

export function correctIngredientKeyword(name: string): string | undefined {
  const words = ingredientNameKey(name).split(' ');
  if (words.some(exactKeyword)) return undefined;
  let match: string | undefined;
  for (const word of words) {
    if (word.length < 5 || preparationWords.has(word)) continue;
    for (const candidate of longKeywords) {
      if (!differsByOneEdit(word, candidate) && !differsByOneEdit(word, candidate + 's')) continue;
      if (match && match !== candidate) return undefined;
      match = candidate;
    }
  }
  return match;
}

export function inferIngredientIcon(name: string): IngredientIcon {
  const words = ingredientNameKey(name).split(' ');
  const [firstWord] = words;
  if (genericPreparations.has(firstWord) || genericPreparations.has(firstWord.replace(/s$/, ''))) return 'other';

  const normalized = ' ' + words.join(' ') + ' ';
  for (const [expression, icon] of expressions) {
    if (normalized.includes(' ' + expression + ' ')) return icon;
  }
  for (const word of words) {
    const icon = exactKeyword(word);
    if (icon) return icon;
  }
  const corrected = correctIngredientKeyword(name);
  return corrected ? iconsByWord.get(corrected) ?? 'other' : 'other';
}
