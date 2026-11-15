import { useEffect, useRef, useState } from 'react';
import { apiRequest, type ApiRecipe, type CatalogPage } from './api';
import { recipePath } from './recipe-data';
import { pantryMatches } from './pantry-search';
import './planning.css';

type Match = { recipe: ApiRecipe; missing: string[] };

export function PantrySearch() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Match[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const latestRequest = useRef<AbortController | null>(null);
  useEffect(() => () => latestRequest.current?.abort(), []);

  async function search(value: string) {
    if (!value.split(/[,;\n]/).some(item => item.trim())) {
      setResults(null);
      return;
    }
    latestRequest.current?.abort();
    const controller = new AbortController();
    latestRequest.current = controller;
    setBusy(true);
    setResults(null);
    setError(false);
    try {
      const recipes = new Map<ApiRecipe['id'], ApiRecipe>();
      let number = 1;
      while (true) {
        const { items, total, limit } = await apiRequest<CatalogPage>('/recipes?limit=50&page=' + number, { signal: controller.signal });
        for (const item of items) recipes.set(item.id, item);
        if (!items.length || number * limit >= total) break;
        number += 1;
      }
      if (!controller.signal.aborted) setResults(pantryMatches([...recipes.values()], value));
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return <main className="section-container planning-page">
    <h1>Recherche par ingrédients</h1>
    <p>Séparez vos ingrédients par des virgules. Les recettes réalisables apparaissent en premier, suivies de celles auxquelles il manque jusqu’à deux ingrédients.</p>
    <form className="form-field planning-input" onSubmit={event => { event.preventDefault(); void search(input); }}>
      <label htmlFor="pantry-ingredients">Ingrédients disponibles</label>
      <textarea id="pantry-ingredients" value={input} onChange={event => setInput(event.target.value)} maxLength={1000} required rows={3} placeholder="Farine, beurre, œufs"/>
      <button className="account-primary" type="submit" disabled={busy || !input.trim()}>{busy ? 'Recherche en cours…' : 'Chercher des recettes'}</button>
    </form>
    {busy && <p role="status">Chargement du catalogue…</p>}
    {error && <p role="alert">Impossible de charger les recettes. Réessayez dans un instant.</p>}
    {results && <p role="status">{results.length ? results.length + ' recette(s) trouvée(s).' : 'Aucune recette correspondante.'}</p>}
    {Boolean(results?.length) && <ul className="planning-list">{results?.map(({ recipe, missing }) => <li key={recipe.id}>
      <div><a className="planning-link" href={recipePath(recipe.id)}>{recipe.title}</a><small>{missing.length ? 'Ingrédients manquants · ' + missing.join(', ') : 'Tous les ingrédients sont disponibles'}</small></div>
    </li>)}</ul>}
  </main>;
}
