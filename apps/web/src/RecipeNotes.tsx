import { useState } from 'react';
import { accountStorageKey } from './local-planning';
import type { Recipe } from './recipe-data';

export function RecipeNotes({ email, recipeId }: { email: string; recipeId: Recipe['id'] }) {
  const key = accountStorageKey('recipe-notes', email) + '.' + recipeId;
  const [note, setNote] = useState(() => {
    try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
  });
  const [feedback, setFeedback] = useState<'saved' | 'error'>();
  return <section className="ingredients-panel recipe-notes">
    <h2>Notes personnelles</h2>
    <p className="panel-hint">Vos notes sont enregistrées dans ce navigateur, pour votre compte.</p>
    <form className="form-field planning-input" onSubmit={event => {
      event.preventDefault();
      try {
        if (note.trim()) localStorage.setItem(key, note);
        else localStorage.removeItem(key);
        setFeedback('saved');
      } catch { setFeedback('error'); }
    }}>
      <label htmlFor="recipe-notes">Mes notes</label>
      <textarea id="recipe-notes" value={note} onChange={event => { setNote(event.target.value); setFeedback(undefined); }} maxLength={4000} rows={4}/>
      <button type="submit" className="account-primary">Enregistrer</button>
    </form>
    {feedback === 'saved' && <p role="status">Notes enregistrées.</p>}
    {feedback === 'error' && <p role="alert">Impossible d’enregistrer les notes dans ce navigateur.</p>}
  </section>;
}
