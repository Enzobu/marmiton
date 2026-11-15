export function accountStorageKey(feature: string, email: string) {
  return 'petitsplats.' + feature + '.' + encodeURIComponent(email.toLowerCase());
}

export function readAccountList<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function normalizeIngredient(value: string) {
  return value.toLocaleLowerCase('fr').normalize('NFD').replace(/\p{Mark}/gu, '')
    .replaceAll('œ', 'oe').replaceAll('’', "'").trim().replace(/\s+/g, ' ');
}

export type ShoppingItem = { id: string; name: string; amount: number | null; unit?: string; checked: boolean };

export function mergeShoppingItems(items: ShoppingItem[], additions: ShoppingItem[]): ShoppingItem[] {
  const next = [...items];
  for (const item of additions) {
    const index = item.amount === null ? -1 : next.findIndex(existing =>
      existing.amount !== null && !existing.checked &&
      normalizeIngredient(existing.name) === normalizeIngredient(item.name) &&
      normalizeIngredient(existing.unit ?? '') === normalizeIngredient(item.unit ?? ''));
    if (index === -1) next.push(item);
    else next[index] = { ...next[index], amount: next[index].amount! + item.amount! };
  }
  return next;
}
