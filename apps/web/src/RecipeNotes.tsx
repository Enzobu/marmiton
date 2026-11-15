import { useState } from 'react';
import { planningRequest, usePlanningData } from './planning-api';
import type { Recipe } from './recipe-data';

export function RecipeNotes({ token, recipeId }: { token: string; recipeId: Recipe['id'] }) {
  const path = '/me/recipe-notes/' + recipeId;
  const { data, error, reload } = usePlanningData<{ note: string }>(path, token);
  const [edited, setEdited] = useState<string>();
  const [feedback, setFeedback] = useState<'saved' | 'error'>();
  const [saving, setSaving] = useState(false);
  const note = edited ?? data?.note ?? '';
  return <section className="ingredients-panel recipe-notes">
    <h2>Notes personnelles</h2>
    {error && <p role="alert">Impossible de charger les notes. <button onClick={reload}>Réessayer</button></p>}
    {!data && !error && <p role="status">Chargement des notes…</p>}
    {data && <form className="form-field planning-input" onSubmit={async event => {
      event.preventDefault();
      if (saving) return;
      setSaving(true);
      setFeedback(undefined);
      try {
        await planningRequest(path, token, { method: 'PUT', body: JSON.stringify({ note }) });
        setEdited(note.trim() ? note : '');
        setFeedback('saved');
      } catch { setFeedback('error'); }
      finally { setSaving(false); }
    }}>
      <label htmlFor="recipe-notes">Mes notes</label>
      <textarea id="recipe-notes" value={note} disabled={saving} onChange={event => { setEdited(event.target.value); setFeedback(undefined); }} maxLength={4000} rows={4}/>
      <button type="submit" className="account-primary" disabled={saving}>Enregistrer</button>
    </form>}
    {feedback === 'saved' && <p role="status">Notes enregistrées.</p>}
    {feedback === 'error' && <p role="alert">Impossible d’enregistrer les notes.</p>}
  </section>;
}
