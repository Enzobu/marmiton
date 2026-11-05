import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { RECIPE_JSON_EXAMPLE, parseRecipeJson, recipeJsonFilename, stringifyRecipeJson, validateRecipeJson, type RecipeJson } from './recipe-json';
import './recipe-json.css';

type Props = { recipe: RecipeJson; onImport: (recipe: RecipeJson) => void; onClose: () => void };

export function RecipeJsonModal({ recipe, onImport, onClose }: Props) {
  const [tab, setTab] = useState<'import' | 'export'>('import');
  const [text, setText] = useState('');
  const [exampleLoaded, setExampleLoaded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const example = stringifyRecipeJson(RECIPE_JSON_EXAMPLE);
  const exportText = stringifyRecipeJson(recipe);
  const exportValidation = validateRecipeJson(recipe);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => previous?.focus();
  }, []);

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); return; }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const elements = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),textarea:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]'));
    if (!elements.length) return;
    if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements[elements.length - 1].focus(); }
    else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) { event.preventDefault(); elements[0].focus(); }
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setFeedback('JSON copié dans le presse-papiers.'); setError(''); }
    catch { setError('Impossible de copier automatiquement. Sélectionne le JSON et copie-le manuellement.'); setFeedback(''); }
  };

  const onValidate = () => {
    const result = parseRecipeJson(text);
    if (!result.ok) { setError(result.error); setFeedback(''); return; }
    setError(''); setFeedback('JSON valide : prêt à importer.');
  };

  const importRecipe = () => {
    const result = parseRecipeJson(text);
    if (!result.ok) { setError(result.error); setFeedback(''); return; }
    onImport(result.value);
  };

  const download = () => {
    if (!exportValidation.ok) { setError(exportValidation.error); return; }
    const file = new Blob([exportText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = recipeJsonFilename(recipe.title);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setFeedback('Téléchargement du fichier JSON lancé.');
    setError('');
  };

  return <div className="recipe-json-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="recipe-json-modal" role="dialog" aria-modal="true" aria-labelledby="json-modal-title" ref={panelRef} onKeyDown={onKey}>
      <div className="recipe-json-header"><div><span className="section-kicker">Outils développeur</span><h2 id="json-modal-title">Intégration JSON</h2><p>Importe une recette ou exporte celle du formulaire.</p></div><button ref={closeRef} type="button" className="recipe-json-close" onClick={onClose} aria-label="Fermer l'intégration JSON">×</button></div>
      <div className="recipe-json-tabs" role="tablist" aria-label="Opération JSON">
        <button role="tab" aria-selected={tab === 'import'} type="button" className={tab === 'import' ? 'active' : ''} onClick={() => { setTab('import'); setError(''); setFeedback(''); }}>Importer</button>
        <button role="tab" aria-selected={tab === 'export'} type="button" className={tab === 'export' ? 'active' : ''} onClick={() => { setTab('export'); setError(''); setFeedback(''); }}>Exporter</button>
      </div>
      <div className="recipe-json-content">
        {tab === 'import' ? <div role="tabpanel" className="recipe-json-panel">
          <label htmlFor="recipe-json-input">Colle ton JSON</label>
          <textarea spellCheck={false} id="recipe-json-input" value={text} onChange={event => { setText(event.target.value); setExampleLoaded(false); setFeedback(''); setError(''); }} rows={13} placeholder={'{\n  "schemaVersion": 1,\n  "title": "Ma recette"\n}'}/>
          <p>Le JSON est validé avant de remplir le formulaire. Aucun enregistrement automatique.</p>
          <div className="recipe-json-actions">
            {exampleLoaded ? <button type="button" className="recipe-json-secondary" onClick={() => void copy(example)}>Copier l'exemple</button> : <button type="button" className="recipe-json-secondary" onClick={() => { setText(example); setExampleLoaded(true); setError(''); setFeedback('Exemple chargé.'); }}>Charger l'exemple</button>}
            <button type="button" className="recipe-json-secondary" onClick={onValidate} disabled={!text.trim()}>Vérifier le JSON</button>
            <button type="button" className="recipe-json-primary" onClick={importRecipe} disabled={!text.trim()}>Importer dans le formulaire</button>
          </div>
        </div> : <div role="tabpanel" className="recipe-json-panel">
          <label htmlFor="recipe-json-export">JSON de la recette actuelle</label>
          <textarea id="recipe-json-export" spellCheck={false} rows={13} readOnly value={exportText} onFocus={event => event.currentTarget.select()}/>
          <p>Les photos choisies sur ton appareil ne sont pas incluses : utilise une URL de photo. Aucun identifiant n'est exporté.</p>
          {!exportValidation.ok && <p className="recipe-json-warning">Complète le formulaire avant d'exporter : {exportValidation.error}</p>}
          <div className="recipe-json-actions">
            <button type="button" className="recipe-json-secondary" disabled={!exportValidation.ok} onClick={() => void copy(exportText)}>Copier</button>
            <button type="button" className="recipe-json-primary" disabled={!exportValidation.ok} onClick={download}>Télécharger</button>
          </div>
        </div>}
        {error && <p className="recipe-json-error" role="alert">{error}</p>}
        {feedback && <p className="recipe-json-feedback" role="status">{feedback}</p>}
      </div>
    </div>
  </div>;
}
