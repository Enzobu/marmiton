import { useEffect, useRef, useState } from 'react';
import { formatQuantity, ingredientBaseServings, ingredientsForRecipe, type Recipe } from './recipe-data';
import './cooking-mode.css';

export function CookingMode({ recipe, servings, step, onPrevious, onCompleteStep, onClose }: {
  recipe: Recipe;
  servings: number;
  step: number;
  onPrevious: () => void;
  onCompleteStep: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [minutes, setMinutes] = useState('5');
  const [deadline, setDeadline] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const expired = deadline !== null && seconds === 0;

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  useEffect(() => {
    if (deadline === null || expired) return;
    const update = () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [deadline, expired]);

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  return <dialog className="cooking-mode" ref={dialog} aria-labelledby="cooking-title" onCancel={event => {
    event.preventDefault();
    onClose();
  }}>
    <header>
      <h2 id="cooking-title">Mode cuisine</h2>
      <button type="button" className="detail-outline-button" onClick={onClose}>Fermer</button>
    </header>
    <p className="cooking-recipe">{recipe.title}</p>
    <h3 ref={heading} tabIndex={-1}>Étape {step + 1} sur {recipe.steps.length}</h3>
    <p className="cooking-instruction">{recipe.steps[step]}</p>
    <nav aria-label="Étapes de la recette">
      <button type="button" className="detail-outline-button" disabled={step === 0} onClick={onPrevious}>Précédente</button>
      <button type="button" className="account-primary" onClick={onCompleteStep}>
        {step + 1 === recipe.steps.length ? 'Terminer' : 'Suivante'}
      </button>
    </nav>
    <details>
      <summary>Ingrédients pour {servings} {servings === 1 ? 'portion' : 'portions'}</summary>
      <ul>{ingredientsForRecipe(recipe).map((ingredient, index) =>
        <li key={index}>{ingredient.name} · {formatQuantity(ingredient, servings, ingredientBaseServings(recipe))}</li>)}</ul>
    </details>
    <form className="cooking-timer" onSubmit={event => {
      event.preventDefault();
      const duration = Number(minutes);
      if (!Number.isInteger(duration) || duration < 1 || duration > 1440) return;
      setSeconds(duration * 60);
      setDeadline(Date.now() + duration * 60_000);
    }}>
      {deadline === null ? <>
        <label>Minuteur (en minutes)<input type="number" value={minutes} onChange={event => setMinutes(event.target.value)} min={1} max={1440} required/></label>
        <button type="submit" className="detail-outline-button">Démarrer</button>
      </> : <>
        <span role="timer" aria-label="Temps restant">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
        <span role="status">{expired ? 'Temps écoulé.' : ''}</span>
        <button type="button" className="detail-outline-button" onClick={() => setDeadline(null)}>{expired ? 'Nouveau minuteur' : 'Arrêter'}</button>
      </>}
    </form>
  </dialog>;
}
