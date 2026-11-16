import { useState } from 'react';
import { planningRequest, usePlanningData } from './planning-api';
import { recipePath } from './recipe-data';
import { localDateKey, weekDays, type PlannedMeal } from './weekly-menu';
import './planning.css';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const weekFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function WeeklyMenu({ token, onAddToShopping }: { token: string; onAddToShopping: (meals: PlannedMeal[]) => Promise<void> }) {
  const [today] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const days = weekDays(today, offset);
  const first = localDateKey(days[0]);
  const { data: currentMeals, error: loadError, reload } = usePlanningData<PlannedMeal[]>('/me/weekly-menu?from=' + first, token);

  async function removeMeal(id: string) {
    setBusy(true);
    setError(false);
    try {
      await planningRequest('/me/weekly-menu/' + id, token, { method: 'DELETE' });
      reload();
    } catch { setError(true); }
    finally { setBusy(false); }
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
    {error && <p role="alert">Impossible de modifier le menu.</p>}
    <div className="planning-actions">
      <button className="account-primary" disabled={!currentMeals?.length || busy} onClick={async () => {
        if (!currentMeals) return;
        setBusy(true);
        try { await onAddToShopping(currentMeals); } finally { setBusy(false); }
      }}>{busy ? 'Ajout en cours…' : 'Ajouter le menu à la liste de courses'}</button>
      <a className="detail-outline-button planning-button" href="/shopping-list">Voir la liste de courses</a>
    </div>
    {loadError && <p role="alert">Impossible de charger le menu. <button onClick={reload}>Réessayer</button></p>}
    {!currentMeals && !loadError && <p role="status">Chargement du menu…</p>}
    {currentMeals && days.map(day => {
      const date = localDateKey(day);
      const entries = currentMeals.filter(meal => meal.date === date);
      return <section className="planning-day" key={date}>
        <h2>{dateFormat.format(day)}</h2>
        {entries.length ? <ul className="planning-list">{entries.map(meal => <li key={meal.id}>
          <div><a href={recipePath(meal.recipeId)}>{meal.title}</a><small>{meal.servings} {meal.servings === 1 ? 'portion' : 'portions'}</small></div>
          <button className="detail-outline-button" disabled={busy} aria-label={'Retirer ' + meal.title} onClick={() => removeMeal(meal.id)}>Retirer</button>
        </li>)}</ul> : <p>Aucun repas prévu.</p>}
      </section>;
    })}
  </main>;
}

export function MealDateForm({ servings, onPlan }: { servings: number; onPlan: (date: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => localDateKey(new Date()));
  return open ? <form className="planning-actions" onSubmit={async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try { if (await onPlan(date)) setOpen(false); } finally { setSaving(false); }
  }}>
    <label className="planning-date">Date du repas<input type="date" min="1000-01-01" max="9999-12-31" value={date} disabled={saving} required onChange={event => setDate(event.target.value)}/></label>
    <button className="detail-outline-button" type="submit" disabled={saving}>Ajouter · {servings} {servings === 1 ? 'portion' : 'portions'}</button>
    <button className="detail-outline-button" type="button" disabled={saving} onClick={() => setOpen(false)}>Annuler</button>
  </form> : <div className="planning-actions"><button className="detail-outline-button" type="button" onClick={() => setOpen(true)}>Planifier ce repas</button></div>;
}
