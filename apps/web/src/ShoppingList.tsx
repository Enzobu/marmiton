import { useState } from 'react';
import { planningRequest, usePlanningData, type ShoppingItem } from './planning-api';
import { ConfirmDialog } from './UiFeedback';
import './planning.css';

const quantityFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const path = '/me/shopping-list';

function groupByRecipe(items: ShoppingItem[]) {
  const groups = new Map<string | null, { title: string; rows: ShoppingItem[] }>();
  for (const item of items) {
    for (const { recipeId, recipeTitle, amount } of item.contributions) {
      let group = groups.get(recipeId);
      if (!group) {
        group = { title: recipeTitle ?? 'Sans recette associée', rows: [] };
        groups.set(recipeId, group);
      }
      group.rows.push({ ...item, amount });
    }
  }
  return Array.from(groups, ([id, group]) => ({ id, ...group })).sort((a, b) => {
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    return a.title.localeCompare(b.title, 'fr');
  });
}

export function ShoppingList({ token }: { token: string }) {
  const { data: items, error: loadError, reload } = usePlanningData<ShoppingItem[]>(path, token);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [byRecipe, setByRecipe] = useState(false);

  async function update(options: RequestInit, id?: string) {
    setBusy(true);
    setError(false);
    try {
      await planningRequest(id ? path + '/' + id : path, token, options);
      reload();
    } catch { setError(true); }
    finally { setBusy(false); }
  }

  function renderItems(rows: ShoppingItem[], allowRemove: boolean) {
    return <ul className="planning-list">
      {rows.map(item => <li key={item.id}>
        <label className={item.checked ? 'planning-checked' : undefined}>
          <input type="checkbox" checked={item.checked} disabled={busy} onChange={event => void update({
            method: 'PATCH', body: JSON.stringify({ checked: event.currentTarget.checked }),
          }, item.id)}/>
          <span>{item.name}{item.amount !== null && <small>{quantityFormat.format(item.amount)} {item.unit}</small>}</span>
        </label>
        {allowRemove && <button type="button" className="detail-outline-button" disabled={busy}
          aria-label={'Retirer ' + item.name} onClick={() => void update({ method: 'DELETE' }, item.id)}>Retirer</button>}
      </li>)}
    </ul>;
  }

  return <main className="section-container planning-page">
    <h1>Ma liste de courses</h1>
    <p>Retrouvez les ingrédients ajoutés depuis vos recettes et vos menus.</p>
    <div className="planning-actions">
      <a className="detail-outline-button planning-button" href="/recipes">Parcourir les recettes
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14m-6-6 6 6-6 6"/>
        </svg>
      </a>
      {!!items?.length && <button type="button" className="detail-outline-button shopping-clear" disabled={busy}
        onClick={() => setConfirmClear(true)}>Vider la liste</button>}
    </div>
    {error && <p role="alert">Impossible de modifier la liste. <button onClick={() => { setError(false); reload(); }}>Actualiser</button></p>}
    {loadError && <p role="alert">Impossible de charger la liste. <button onClick={reload}>Réessayer</button></p>}
    {!items && !loadError && <p role="status">Chargement de la liste…</p>}
    {items && (items.length === 0 ? <p>Votre liste est vide.</p> : <>
      <div className="filter-chips shopping-views" role="group" aria-label="Affichage de la liste de courses">
        <button type="button" className={!byRecipe ? 'active' : undefined} aria-pressed={!byRecipe} onClick={() => setByRecipe(false)}>Tous les articles</button>
        <button type="button" className={byRecipe ? 'active' : undefined} aria-pressed={byRecipe} onClick={() => setByRecipe(true)}>Par recette</button>
      </div>
      {byRecipe ? groupByRecipe(items).map(({ id, title, rows }) => <section className="shopping-recipe-group" key={id ?? 'unassigned'}>
        <h2>{title}</h2>
        {renderItems(rows, false)}
      </section>) : renderItems(items, true)}
    </>)}
    {confirmClear && <ConfirmDialog title="Vider la liste de courses ?"
      description="Tous les articles seront supprimés, cochés ou non."
      confirmLabel="Vider la liste" destructive onCancel={() => setConfirmClear(false)} onConfirm={() => {
        setConfirmClear(false);
        void update({ method: 'DELETE' });
      }}/>}
  </main>;
}
