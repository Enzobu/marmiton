import { useState } from 'react';
import { planningRequest, usePlanningData, type ShoppingItem } from './planning-api';
import './planning.css';

const quantityFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

export function ShoppingList({ token }: { token: string }) {
  const path = '/me/shopping-list';
  const { data: items, error: loadError, reload } = usePlanningData<ShoppingItem[]>(path, token);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function update(id: string, options: RequestInit) {
    setBusy(true);
    setError(false);
    try {
      await planningRequest(path + '/' + id, token, options);
      reload();
    } catch { setError(true); }
    finally { setBusy(false); }
  }

  return <main className="section-container planning-page">
    <h1>Ma liste de courses</h1>
    <p>Retrouvez les ingrédients ajoutés depuis vos recettes et vos menus.</p>
    <a href="/recipes">Parcourir les recettes</a>
    {error && <p role="alert">Impossible de modifier la liste. <button onClick={() => { setError(false); reload(); }}>Actualiser</button></p>}
    {loadError && <p role="alert">Impossible de charger la liste. <button onClick={reload}>Réessayer</button></p>}
    {!items && !loadError && <p role="status">Chargement de la liste…</p>}
    {items && (items.length === 0 ? <p>Votre liste est vide.</p> :
      <ul className="planning-list">
        {items.map(item => <li key={item.id}>
          <label className={item.checked ? 'planning-checked' : undefined}>
            <input type="checkbox" checked={item.checked} disabled={busy} onChange={event => void update(item.id, {
              method: 'PATCH', body: JSON.stringify({ checked: event.currentTarget.checked }),
            })}/>
            <span>{item.name}{item.amount !== null && <small>{quantityFormat.format(item.amount)} {item.unit}</small>}</span>
          </label>
          <button className="detail-outline-button" disabled={busy} aria-label={'Retirer ' + item.name} onClick={() => void update(item.id, { method: 'DELETE' })}>Retirer</button>
        </li>)}
      </ul>)}
  </main>;
}
