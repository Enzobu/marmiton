import { useState } from 'react';
import { accountStorageKey, readAccountList, type ShoppingItem } from './local-planning';
import './planning.css';

const quantityFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

export function ShoppingList({ email }: { email: string }) {
  const key = accountStorageKey('shopping', email);
  const [items, setItems] = useState(() => readAccountList<ShoppingItem>(key));
  const [error, setError] = useState(false);

  function update(change: (items: ShoppingItem[]) => ShoppingItem[]) {
    const next = change(readAccountList<ShoppingItem>(key));
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setItems(next);
      setError(false);
    } catch { setError(true); }
  }

  return <main className="section-container planning-page">
    <h1>Ma liste de courses</h1>
    <p>Les ingrédients ajoutés depuis vos recettes sont enregistrés dans ce navigateur.</p>
    <a href="/recipes">Parcourir les recettes</a>
    {error && <p role="alert">Impossible d’enregistrer la liste dans ce navigateur.</p>}
    {items.length === 0 ? <p>Votre liste est vide.</p> :
      <ul className="planning-list">
        {items.map(item => <li key={item.id}>
          <label className={item.checked ? 'planning-checked' : undefined}>
            <input type="checkbox" checked={item.checked} onChange={event => {
              const checked = event.currentTarget.checked;
              update(current => current.map(entry => entry.id === item.id ? { ...entry, checked } : entry));
            }}/>
            <span>{item.name}{item.amount !== null && <small>{quantityFormat.format(item.amount)} {item.unit}</small>}</span>
          </label>
          <button className="detail-outline-button" aria-label={'Retirer ' + item.name} onClick={() => update(current => current.filter(entry => entry.id !== item.id))}>Retirer</button>
        </li>)}
      </ul>}
  </main>;
}
