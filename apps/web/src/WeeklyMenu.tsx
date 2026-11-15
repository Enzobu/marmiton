import { useState } from 'react';
import { accountStorageKey, readAccountList } from './local-planning';
import { recipePath } from './recipe-data';
import { localDateKey, weekDays, type PlannedMeal } from './weekly-menu';
import './planning.css';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const weekFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function WeeklyMenu({ email, onAddToShopping }: { email: string; onAddToShopping: (meals: PlannedMeal[]) => Promise<void> }) {
  const key = accountStorageKey('weekly-menu', email);
  const [today] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const [meals, setMeals] = useState(() => readAccountList<PlannedMeal>(key));
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const days = weekDays(today, offset);
  const first = localDateKey(days[0]);
  const last = localDateKey(days[6]);
  const currentMeals = meals.filter(meal => meal.date >= first && meal.date <= last);

  function removeMeal(id: string) {
    try {
      const next = readAccountList<PlannedMeal>(key).filter(meal => meal.id !== id);
      localStorage.setItem(key, JSON.stringify(next));
      setMeals(next);
      setError(false);
    } catch { setError(true); }
  }

  return <main className="section-container planning-page">
    <h1>Menu de la semaine</h1>
    <p>Choisissez les portions et le jour de chaque repas depuis sa fiche recette.</p>
    <a href="/recipes">Parcourir les recettes</a>
    <nav className="planning-actions" aria-label="Navigation entre les semaines">
      <button className="detail-outline-button" onClick={() => setOffset(current => current - 1)}>Semaine précédente</button>
      <button className="detail-outline-button" onClick={() => setOffset(0)} disabled={offset === 0}>Cette semaine</button>
      <button className="detail-outline-button" onClick={() => setOffset(current => current + 1)}>Semaine suivante</button>
    </nav>
    <p role="status">Du {weekFormat.format(days[0])} au {weekFormat.format(days[6])}</p>
    {error && <p role="alert">Impossible de modifier le menu dans ce navigateur.</p>}
    <div className="planning-actions">
      <button className="account-primary" disabled={!currentMeals.length || busy} onClick={async () => {
        setBusy(true);
        try { await onAddToShopping(currentMeals); } finally { setBusy(false); }
      }}>{busy ? 'Ajout en cours…' : 'Ajouter le menu à la liste de courses'}</button>
      <a className="planning-link" href="/shopping-list">Voir la liste de courses</a>
    </div>
    {days.map(day => {
      const date = localDateKey(day);
      const entries = currentMeals.filter(meal => meal.date === date);
      return <section className="planning-day" key={date}>
        <h2>{dateFormat.format(day)}</h2>
        {entries.length ? <ul className="planning-list">{entries.map(meal => <li key={meal.id}>
          <div><a href={recipePath(meal.recipeId)}>{meal.title}</a><small>{meal.servings} {meal.servings === 1 ? 'portion' : 'portions'}</small></div>
          <button className="detail-outline-button" aria-label={'Retirer ' + meal.title} onClick={() => removeMeal(meal.id)}>Retirer</button>
        </li>)}</ul> : <p>Aucun repas prévu.</p>}
      </section>;
    })}
  </main>;
}

export function MealDateForm({ servings, onPlan }: { servings: number; onPlan: (date: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => localDateKey(new Date()));
  return open ? <form className="planning-actions" onSubmit={event => {
    event.preventDefault();
    if (onPlan(date)) setOpen(false);
  }}>
    <label className="planning-date">Date du repas<input type="date" min="0001-01-01" max="9999-12-31" value={date} required onChange={event => setDate(event.target.value)}/></label>
    <button className="detail-outline-button" type="submit">Ajouter · {servings} {servings === 1 ? 'portion' : 'portions'}</button>
    <button className="detail-outline-button" type="button" onClick={() => setOpen(false)}>Annuler</button>
  </form> : <div className="planning-actions"><button className="detail-outline-button" type="button" onClick={() => setOpen(true)}>Planifier ce repas</button></div>;
}
