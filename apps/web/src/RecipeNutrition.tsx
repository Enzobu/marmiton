import { useEffect, useState } from 'react';
import { SelectField } from './SelectField';
import { apiRequest, authHeaders } from './api';
import { nutrients, type FoodChoice, type Macros, type Nutrient, type NutritionOverride, type NutritionSummary } from '../../api/src/nutrition-types.ts';
import { ingredientWeight } from '../../api/src/nutrition-weight.ts';
import './recipe-nutrition.css';

const labels: Record<Nutrient, string> = { kcal: 'Énergie', protein: 'Protéines', carbs: 'Glucides', fat: 'Lipides' };
const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const missingLabels = { food: 'aliment à préciser', weight: 'poids à préciser', values: 'valeurs nutritionnelles incomplètes' };

function NutritionValues({ values, multiplier = 1 }: { values: Macros; multiplier?: number }) {
  return <dl className="nutrition-values">
    {nutrients.map(key => <div key={key}>
      <dt>{labels[key]}</dt>
      <dd>{values[key] === null ? '—' : `${numberFormat.format(values[key] * multiplier)} ${key === 'kcal' ? 'kcal' : 'g'}`}</dd>
    </div>)}
  </dl>;
}

export function RecipeNutrition({ summary, servings }: { summary: NutritionSummary; servings: number }) {
  const [showTotal, setShowTotal] = useState(false);
  const partial = summary.missing.length > 0;
  return <section className="nutrition-panel" aria-label="Nutrition de la recette">
    <div className="nutrition-heading">
      <h2>{partial ? 'Sous-total nutritionnel estimé' : 'Nutrition estimée'} {showTotal ? `pour ${servings} portion${servings > 1 ? 's' : ''}` : 'par portion'}</h2>
      <button type="button" className="detail-outline-button" onClick={() => setShowTotal(value => !value)}>
        {showTotal ? 'Par portion' : 'Voir le total'}
      </button>
    </div>
    <NutritionValues values={summary.perPortion} multiplier={showTotal ? servings : 1}/>
    {partial && <details className="nutrition-missing">
      <summary>Calcul partiel · {summary.missing.length} ingrédient{summary.missing.length > 1 ? 's' : ''} à vérifier</summary>
      <ul>{summary.missing.map(item => <li key={item.position}>{item.name} ({missingLabels[item.reason]})</li>)}</ul>
    </details>}
    <small>Source des valeurs de référence : {summary.source}</small>
  </section>;
}

type FoodMatches = { results: FoodChoice[]; match: FoodChoice | null };
type EditorProps = {
  name: string;
  amount: string;
  unit: string;
  value?: NutritionOverride;
  token: string | null;
  onChange: (value: NutritionOverride | undefined) => void;
};

export function IngredientNutritionEditor(props: EditorProps) {
  const [open, setOpen] = useState(false);
  if (!props.name.trim()) return null;
  return <details className="ingredient-nutrition" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Nutrition <span>{props.value ? '· corrigée' : '· automatique'}</span></summary>
    {open && <NutritionControls {...props}/>}
  </details>;
}

function NutritionControls({ name, amount, unit, value, token, onChange }: EditorProps) {
  const [query, setQuery] = useState(name);
  const [matches, setMatches] = useState<FoodMatches | null>(null);
  const [searchError, setSearchError] = useState(false);
  const [manual, setManual] = useState(Boolean(value?.per100g));
  const manualFields = (values?: NutritionOverride['per100g']): Record<Nutrient, string> => ({
    kcal: values?.kcal.toString() ?? '', protein: values?.protein.toString() ?? '',
    carbs: values?.carbs.toString() ?? '', fat: values?.fat.toString() ?? '',
  });
  const [custom, setCustom] = useState(() => manualFields(value?.per100g));
  const hasCustom = value?.per100g !== undefined;
  const selectedCode = value?.foodCode;
  useEffect(() => {
    if (manual) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchError(false);
      const params = new URLSearchParams({ q: query, ingredient: name.slice(0, 160) });
      if (selectedCode) params.set('selected', String(selectedCode));
      void apiRequest<FoodMatches>(`/nutrition/foods?${params}`, { headers: authHeaders(token), signal: controller.signal })
        .then(setMatches)
        .catch(() => { if (!controller.signal.aborted) { setMatches(null); setSearchError(true); } });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [manual, name, query, selectedCode, token]);

  const automaticGrams = ingredientWeight(name, amount.trim() && Number.isFinite(Number(amount)) ? Number(amount) : null, unit);
  const canApply = nutrients.every(key => custom[key].trim() && Number(custom[key]) >= 0 && Number(custom[key]) <= (key === 'kcal' ? 1000 : 100));
  function changeWeight(grams: string) {
    const next = { ...value, grams: grams === '' ? undefined : Number(grams) };
    onChange(Object.values(next).some(field => field !== undefined) ? next : undefined);
  }
  function setFood(foodCode: number) {
    onChange({ grams: value?.grams, foodCode });
  }
  function reset() {
    onChange(undefined);
    setManual(false);
    setCustom(manualFields());
  }

  return <div className="nutrition-controls">
    <div className="nutrition-control-grid">
      <label className="form-field">Poids comestible total (g)
        <input type="number" min="0" max="100000000" step="any" value={value?.grams ?? ''}
          placeholder={automaticGrams === null ? 'À préciser' : String(automaticGrams)}
          onChange={event => changeWeight(event.target.value)}/>
        {automaticGrams !== null && <small>Poids automatique : {numberFormat.format(automaticGrams)} g</small>}
      </label>
      <SelectField className="form-field" label="Source nutritionnelle" value={manual ? 'manual' : 'ciqual'}
        onChange={mode => setManual(mode === 'manual')}
        options={[{ value: 'ciqual', label: 'Table Ciqual' }, { value: 'manual', label: 'Étiquette du produit' }]}/>
    </div>
    {manual ? <div>
      <div className="nutrition-control-grid">
        {nutrients.map(key => <label className="form-field" key={key}>{labels[key]} ({key === 'kcal' ? 'kcal' : 'g'} / 100 g)
          <input type="number" min="0" max={key === 'kcal' ? 1000 : 100} step="any" value={custom[key]}
            onChange={event => setCustom(current => ({...current, [key]: event.target.value}))}/>
        </label>)}
      </div>
      <div className="nutrition-editor-actions">
        <button className="detail-outline-button" type="button" disabled={!canApply} onClick={() => onChange({
          grams: value?.grams, per100g: { kcal: Number(custom.kcal), protein: Number(custom.protein), carbs: Number(custom.carbs), fat: Number(custom.fat) },
        })}>Appliquer les valeurs</button>
        {hasCustom && <span role="status">Valeurs de l’étiquette appliquées</span>}
      </div>
    </div> : <div className="nutrition-food-search">
      <label className="form-field">Rechercher dans Ciqual
        <input type="search" value={query} maxLength={160} onChange={event => setQuery(event.target.value)}/>
      </label>
      {hasCustom && <p>Valeurs de l’étiquette actives. Choisis un aliment pour les remplacer.</p>}
      {!hasCustom && matches?.match && <p>{selectedCode ? 'Sélection' : 'Association automatique'} : {matches.match.name}</p>}
      {searchError && <p role="alert">La recherche Ciqual est indisponible.</p>}
      {!searchError && query.trim() && matches && matches.results.length === 0 && <p>Aucun aliment trouvé. Essaie un nom plus court.</p>}
      {matches?.results.length ? <ul className="nutrition-results">
        {matches.results.map(food => <li key={food.code}><button type="button" aria-pressed={selectedCode === food.code}
          onClick={() => setFood(food.code)}>{food.name}</button></li>)}
      </ul> : null}
      {selectedCode && <label className="nutrition-remember"><input type="checkbox" checked={Boolean(value?.remember)}
        onChange={event => onChange({ ...value, remember: event.target.checked })}/> Réutiliser cette association pour « {name} »</label>}
    </div>}
    {value && <button type="button" className="detail-outline-button" onClick={reset}>Revenir au calcul automatique</button>}
  </div>;
}
