export function normalizeIngredient(value: string) {
  return value.toLocaleLowerCase('fr').normalize('NFD').replace(/\p{Mark}/gu, '')
    .replaceAll('œ', 'oe').replaceAll('’', "'").trim().replace(/\s+/g, ' ');
}
