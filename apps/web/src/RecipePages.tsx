import { IngredientPicture } from './IngredientPicture';
import { RecipeNotes } from './RecipeNotes';
import { MealDateForm } from './WeeklyMenu';
import { CookingMode } from './CookingMode';
import { SelectField } from './SelectField';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { clearDraft, readDraft, saveDraft, validateRecipeImage, type RecipeDraft } from './recipe-draft';
import { RECIPE_DIFFICULTIES, validateRecipeJson, type RecipeDifficulty, type RecipeJson } from './recipe-json';
import { RecipeJsonModal } from './RecipeJsonModal';
import { ConfirmDialog } from './UiFeedback';
import { BASE_SERVINGS, formatQuantity, formatTime, ingredientBaseServings, ingredientsForRecipe, recipePreparation, type Ingredient, type Recipe } from './recipe-data';
import { ToggleSwitch } from './ToggleSwitch';
import { ImagePicker } from './ImagePicker';
import './recipe-pages.css';

import { useAuthenticatedImage } from './useAuthenticatedImage';

type Navigate = (path: string) => void;

type SharedProps = { token: string | null; navigate: Navigate; favorite: boolean; toggleFavorite: (id: Recipe['id']) => void };

function Glyph({ name, size = 20 }: { name: 'back' | 'clock' | 'star' | 'heart' | 'minus' | 'plus' | 'check' | 'people' | 'chef' | 'wallet' | 'print' | 'arrow' | 'trash'; size?: number }) {
  const shapes: Record<typeof name, React.ReactNode> = {
    back: <path d="m14 6-6 6 6 6M8 12h12"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    star: <path d="m12 2 3.1 6.4 7 .9-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7L2 9.3l7-.9L12 2Z"/>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    minus: <path d="M5 12h14"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    check: <path d="m4 12 5 5L20 6"/>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M2 20a7 7 0 0 1 14 0M16 5a3 3 0 0 1 0 6m2 3a6 6 0 0 1 4 6"/></>,
    chef: <><path d="M6 13a4 4 0 0 1-1-7 5 5 0 0 1 9-2 4 4 0 1 1 5 8v7H6Z"/><path d="M6 17h13"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18M16 15h2"/></>,
    print: <><path d="M7 8V3h10v5M7 18H4V9h16v9h-3"/><path d="M7 14h10v7H7Z"/></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    trash: <><path d="M4 7h16M9 4h6M7 7l1 14h8l1-14M10 11v7m4-7v7"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}

export function RecipeDetail({ recipe, navigate, favorite, toggleFavorite, token, addToShopping, onPlanMeal, showNotes }: { recipe: Recipe; showNotes: boolean; addToShopping: (servings: number) => Promise<boolean>; onPlanMeal: (servings: number, date: string) => Promise<boolean> } & SharedProps) {
  const [servings, setServings] = useState(recipe.servings ?? BASE_SERVINGS);
  const [checked, setChecked] = useState<string[]>([]);
  const [finishedSteps, setFinishedSteps] = useState<number[]>([]);
  const [cooking, setCooking] = useState(false);
  const [cookingStep, setCookingStep] = useState<number>();
  const [shoppingStatus, setShoppingStatus] = useState<'idle' | 'pending' | 'added'>('idle');

  useEffect(() => {
    if (shoppingStatus !== 'added') return;
    const timeout = window.setTimeout(() => setShoppingStatus('idle'), 2000);
    return () => window.clearTimeout(timeout);
  }, [shoppingStatus]);

  const firstUnfinishedStep = recipe.steps.findIndex((_, index) => !finishedSteps.includes(index));
  const activeStep = Math.min(cookingStep ?? Math.max(firstUnfinishedStep, 0), recipe.steps.length - 1);
  const allStepsFinished = firstUnfinishedStep === -1;

  function completeCookingStep() {
    setFinishedSteps(current => current.includes(activeStep) ? current : [...current, activeStep]);
    if (activeStep === recipe.steps.length - 1) {
      setCooking(false);
      setCookingStep(undefined);
    } else {
      setCookingStep(activeStep + 1);
    }
  }

  async function addIngredients() {
    setShoppingStatus('pending');
    let added = false;
    try {
      added = await addToShopping(servings);
    } finally {
      setShoppingStatus(added ? 'added' : 'idle');
    }
  }
  const image = useAuthenticatedImage(recipe.image, recipe.privateImage, token);
  const metadata = recipe.preparation ?? recipePreparation[recipe.id] ?? { prep: recipe.time, cook: 0, rest: 0, budget: 'Bon marché', utensils: ['Saladier', 'Couteau'] };
  const ingredients = ingredientsForRecipe(recipe);
  return <main className="detail-page">
    {cooking && activeStep >= 0 && <CookingMode recipe={recipe} servings={servings} step={activeStep}
      onPrevious={() => setCookingStep(activeStep - 1)} onCompleteStep={completeCookingStep}
      onClose={() => setCooking(false)}/>}
    <div className="detail-container">
      <nav className="breadcrumbs" aria-label="Fil d’Ariane"><a href="/" onClick={event => { event.preventDefault(); navigate('/'); }}>Accueil</a><span>/</span><a href="/recipes" onClick={event => { event.preventDefault(); navigate('/recipes'); }}>Recettes</a><span>/</span><span aria-current="page">{recipe.title}</span></nav>
      <div className="detail-intro"><div><span className="section-kicker">{recipe.category}</span><h1>{recipe.title}</h1><p>{recipe.description}</p><div className="detail-rating"><Glyph name="star" size={17}/><strong>{recipe.rating.toFixed(1).replace('.', ',')} / 5</strong><span>· {recipe.reviews} avis{recipe.reviews > 0 ? ' (données d’exemple)' : ''}</span></div></div><div className="detail-actions"><button className={`detail-outline-button ${favorite ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(recipe.id)} aria-pressed={favorite}><Glyph name="heart"/>{favorite ? 'Dans mes favoris' : 'Sauvegarder'}</button><button className="detail-icon-button" onClick={() => window.print()} aria-label="Imprimer la recette" title="Imprimer"><Glyph name="print"/></button></div></div>
      <div className="detail-photo">{image && <img src={image} alt={recipe.title}/>}<div className="detail-photo-note">Photo de la recette</div></div>
      <div className="detail-stats" aria-label="Informations de la recette"><div><Glyph name="clock" size={22}/><span>Préparation</span><strong>{metadata.prep ? formatTime(metadata.prep) : '—'}</strong></div><div><Glyph name="clock" size={22}/><span>Cuisson</span><strong>{metadata.cook ? formatTime(metadata.cook) : '—'}</strong></div><div><Glyph name="clock" size={22}/><span>Repos</span><strong>{metadata.rest ? formatTime(metadata.rest) : '—'}</strong></div><div><Glyph name="chef" size={23}/><span>Difficulté</span><strong>{recipe.difficulty}</strong></div><div><Glyph name="wallet" size={22}/><span>Budget</span><strong>{metadata.budget}</strong></div></div>
      <div className="detail-columns">
        <aside className="ingredients-panel"><div className="panel-heading"><div><span className="section-kicker">Avant de commencer</span><h2>Ingrédients</h2></div><span className="panel-count">{ingredients.length} ingrédients</span></div>
          <div className="servings-control"><div><Glyph name="people" size={20}/><span>Nombre de portions</span></div><div className="servings-stepper"><button type="button" onClick={() => setServings(current => Math.max(1, current - 1))} disabled={servings <= 1} aria-label="Diminuer le nombre de personnes"><Glyph name="minus" size={17}/></button><output aria-live="polite">{servings}</output><button type="button" onClick={() => setServings(current => Math.min(12, current + 1))} disabled={servings >= 12} aria-label="Augmenter le nombre de personnes"><Glyph name="plus" size={17}/></button></div></div>
          <p className="panel-hint">Les quantités s’adaptent automatiquement au nombre de personnes.</p>
          <ul className="ingredient-list">{ingredients.map(ingredient => <li key={ingredient.name}><label className={checked.includes(ingredient.name) ? 'ingredient-checked' : ''}><input type="checkbox" checked={checked.includes(ingredient.name)} onChange={() => setChecked(current => current.includes(ingredient.name) ? current.filter(item => item !== ingredient.name) : [...current, ingredient.name])}/><IngredientPicture ingredient={ingredient}/><span className="ingredient-description"><strong>{formatQuantity(ingredient, servings, ingredientBaseServings(recipe))}</strong><span>{ingredient.name}</span></span></label></li>)}</ul>
          {ingredients.length > 0 && <div className="planning-actions">
            <button type="button" className={`detail-outline-button shopping-add ${shoppingStatus === 'added' ? 'is-added' : ''}`}
              disabled={shoppingStatus !== 'idle'} onClick={() => void addIngredients()}>
              {shoppingStatus === 'added' && <Glyph name="check" size={17}/>}
              {shoppingStatus === 'added' ? 'Ajouté à la liste' : 'Ajouter à la liste de courses'}
            </button>
            <span className="sr-only" role="status">{shoppingStatus === 'added' ? 'Ingrédients ajoutés à la liste de courses.' : ''}</span>
            {token && <a className="detail-outline-button planning-button" href="/shopping-list" onClick={event => {
              if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                event.preventDefault();
                navigate('/shopping-list');
              }
            }}>Voir la liste<Glyph name="arrow" size={16}/></a>}
          </div>}
          <MealDateForm servings={servings} onPlan={date => onPlanMeal(servings, date)}/>
          <div className="utensil-block"><h3>Ustensiles</h3><ul>{metadata.utensils.map(item => <li key={item}><Glyph name="chef" size={17}/>{item}</li>)}</ul></div>
          <div className="panel-note"><strong>Petit conseil</strong><p>Cochez les ingrédients à mesure que vous les préparez.</p></div>
        </aside>
        <div className="preparation-panel"><span className="section-kicker">Étapes</span><h2>La préparation</h2><p className="preparation-lead">Marquez chaque étape une fois terminée pour suivre votre progression.</p>{recipe.steps.length > 0 && <div className="planning-actions cooking-launch">
          <button type="button" className="detail-outline-button" onClick={() => {
            setCookingStep(Math.max(firstUnfinishedStep, 0));
            setCooking(true);
          }}>{!allStepsFinished && (cookingStep !== undefined || finishedSteps.length > 0) ? 'Reprendre le mode cuisine' : 'Lancer le mode cuisine'}</button>
        </div>}<div className="preparation-progress"><div><strong>{finishedSteps.length} / {recipe.steps.length}</strong> étapes terminées</div>
          {!allStepsFinished && !cooking && (cookingStep !== undefined || finishedSteps.length > 0) && <p className="cooking-resume">Étape en cours : {firstUnfinishedStep + 1}</p>}<div className="progress-track"><span style={{ width: `${recipe.steps.length ? 100 * finishedSteps.length / recipe.steps.length : 0}%` }}/></div></div>
          <ol className="step-list">{recipe.steps.map((step, index) => <li className={finishedSteps.includes(index) ? 'step-done' : ''} key={index}><button type="button" className="step-number" aria-label={finishedSteps.includes(index) ? `Marquer l’étape ${index + 1} non terminée` : `Marquer l’étape ${index + 1} terminée`} aria-pressed={finishedSteps.includes(index)} onClick={() => setFinishedSteps(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index])}>{finishedSteps.includes(index) ? <Glyph name="check" size={20}/> : (index + 1).toString().padStart(2, '0')}</button><div><h3>Étape {index + 1}</h3><p>{step}</p></div></li>)}</ol>
          <div className="detail-tip"><span className="tip-icon"><Glyph name="chef" size={24}/></span><div><strong>Conseil de préparation</strong><p>Préparez les ingrédients et les ustensiles avant de commencer.</p></div></div>
        </div>
      </div>
      {showNotes && token && <RecipeNotes key={token} token={token} recipeId={recipe.id}/>}
      <div className="detail-bottom-nav"><a href="/recipes" onClick={event => { event.preventDefault(); navigate('/recipes'); }}><Glyph name="back"/>Retour aux recettes</a></div>
    </div>
  </main>;
}

type DraftIngredient = { id: number; name: string; amount: string; unit: string };
type DraftStep = { id: number; value: string };
const demoImage = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85';

export type RecipeSubmission = { recipe: RecipeJson; isPublic: boolean; photo?: string; keepPhoto?: boolean };

export function RecipeCreate({ navigate, onCreate, initialRecipe, developerMode = false, token, defaultPublic }: {
  navigate: Navigate;
  onCreate: (submission: RecipeSubmission, id?: Recipe['id']) => Promise<Recipe>;
  initialRecipe?: Recipe;
  developerMode?: boolean;
  token: string | null;
  defaultPublic: boolean;
}) {
  const initialMeta = initialRecipe?.preparation;
  const initialPhoto = useAuthenticatedImage(initialRecipe?.image, initialRecipe?.privateImage, token);
  const [isPublic, setIsPublic] = useState(initialRecipe?.isPublic ?? defaultPublic);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initialRecipe?.title ?? '');
  const [description, setDescription] = useState(initialRecipe?.description ?? '');
  const [category, setCategory] = useState(initialRecipe?.category ?? 'Plats');
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>(initialRecipe?.difficulty ?? 'Facile');
  const [prep, setPrep] = useState(initialMeta?.prep ?? 15);
  const [rest, setRest] = useState(initialMeta?.rest ?? 0);
  const [budget, setBudget] = useState(initialMeta?.budget ?? 'Bon marché');
  const [utensils, setUtensils] = useState<string[]>(initialMeta?.utensils ?? []);
  const [utensilInput, setUtensilInput] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [savedDraft, setSavedDraft] = useState<RecipeDraft | null>(() => initialRecipe ? null : readDraft());
  const [draftMessage, setDraftMessage] = useState('');
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<RecipeJson | null>(null);
  const [cook, setCook] = useState(initialMeta?.cook ?? 30);
  const [servings, setServings] = useState(initialMeta?.servings ?? initialRecipe?.servings ?? 4);
  const [image, setImage] = useState(initialRecipe?.image ?? '');
  const [items, setItems] = useState<DraftIngredient[]>(() => initialRecipe ? (initialRecipe.quantities ?? []).map((item, index) => ({ id: index + 1, name: item.name, amount: item.amount === null ? '' : String(item.amount), unit: item.unit ?? '' })) : [{ id: 1, name: '', amount: '', unit: 'g' }]);
  const [steps, setSteps] = useState<DraftStep[]>(() => initialRecipe ? initialRecipe.steps.map((value,index) => ({ id: index+100, value })) : [{ id: 100, value: '' }]);
  const [error, setError] = useState('');
  const [counter, setCounter] = useState(1000);
  useEffect(() => {
    if (initialRecipe || savedDraft) return;
    const timeout = window.setTimeout(() => {
      saveDraft({ title, description, category, difficulty, prep, cook, rest, servings, budget, utensils, image, items, steps });
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [initialRecipe, savedDraft, title, description, category, difficulty, prep, cook, rest, servings, budget, utensils, image, items, steps]);

  const restoreDraft = () => {
    if (!savedDraft) return;
    setTitle(savedDraft.title); setDescription(savedDraft.description);
    setCategory(savedDraft.category); setDifficulty(savedDraft.difficulty);
    setPrep(savedDraft.prep); setCook(savedDraft.cook); setRest(savedDraft.rest);
    setServings(savedDraft.servings); setBudget(savedDraft.budget);
    setUtensils(savedDraft.utensils); setImage(savedDraft.image);
    setItems(savedDraft.items); setSteps(savedDraft.steps);
    setCounter(Math.max(1000, ...savedDraft.items.map(item => item.id), ...savedDraft.steps.map(step => step.id)) + 1);
    setSavedDraft(null);
    setDraftMessage('Brouillon récupéré.');
  };
  const onPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const error = validateRecipeImage(file);
    if (error) { setPhotoError(error); return; }
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setImage(reader.result); };
    reader.onerror = () => setPhotoError('Impossible de lire la photo.');
    reader.readAsDataURL(file);
  };
  const addUtensil = () => {
    const value = utensilInput.trim();
    if (value && !utensils.includes(value) && utensils.length < 20) setUtensils(current => [...current, value]);
    setUtensilInput('');
  };
  const exportRecipe: RecipeJson = {
    schemaVersion: 1,
    title, description,
    category: category as RecipeJson['category'],
    difficulty,
    servings,
    times: { preparation: prep, cooking: cook, rest },
    budget: budget as RecipeJson['budget'],
    ingredients: items.map(item => ({ name: item.name, quantity: item.amount.trim() === '' ? null : Number(item.amount), unit: item.unit })),
    utensils, steps: steps.map(step => step.value),
    imageUrl: /^https?:\/\//i.test(image) ? image : null
  };
  const importRecipe = (document: RecipeJson) => setPendingImport(document);
  const applyImportedRecipe = () => {
    if (!pendingImport) return;
    const document = pendingImport;
    setTitle(document.title); setDescription(document.description);
    setCategory(document.category); setDifficulty(document.difficulty);
    setPrep(document.times.preparation); setCook(document.times.cooking); setRest(document.times.rest);
    setBudget(document.budget); setServings(document.servings); setUtensils([...document.utensils]);
    setImage(document.imageUrl ?? '');
    setItems(document.ingredients.map((item,index) => ({ id: index + 1, name: item.name, amount: item.quantity === null ? '' : String(item.quantity), unit: item.unit })));
    setSteps(document.steps.map((value,index) => ({ id: 100 + index, value })));
    setCounter(1000);
    setSavedDraft(null); setPhotoError(''); setError('');
    setDraftMessage('Recette importée dans le formulaire. Vérifiez les informations avant d’enregistrer.');
    setJsonModalOpen(false);
    setPendingImport(null);
  };
  const addIngredient = () => { setItems(value => [...value, { id: counter, name: '', amount: '', unit: 'g' }]); setCounter(value => value + 1); };
  const addStep = () => { setSteps(value => [...value, { id: counter, value: '' }]); setCounter(value => value + 1); };
  const updateIngredient = (id: number, field: 'name' | 'amount' | 'unit', value: string) => setItems(current => current.map(item => item.id === id ? { ...item, [field]: value } : item));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const checked = validateRecipeJson(exportRecipe);
    if (!checked.ok) { setError(checked.error); return; }
    setError('');
    setSaving(true);
    try {
      const saved = await onCreate({
        recipe: checked.value, isPublic,
        photo: image.startsWith('data:') ? image : undefined,
        keepPhoto: Boolean(initialRecipe?.image && initialRecipe.image === image),
      }, initialRecipe?.id);
      if (!initialRecipe) clearDraft();
      navigate(`/recipes/${saved.id}`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Impossible d’enregistrer la recette.');
    } finally { setSaving(false); }
  };
  return <main className="create-page"><div className="detail-container"><nav className="breadcrumbs" aria-label="Fil d’Ariane"><a href="/" onClick={event => {event.preventDefault();navigate('/');}}>Accueil</a><span>/</span><a href="/recipes" onClick={event => {event.preventDefault();navigate('/recipes');}}>Recettes</a><span>/</span><span aria-current="page">{initialRecipe ? 'Modifier la recette' : 'Nouvelle recette'}</span></nav>
    <div className="create-heading"><span className="section-kicker">Carnet de recettes</span><div className="create-heading-actions"><h1>{initialRecipe ? 'Modifier la recette' : 'Créer une recette'}</h1>{developerMode && <button type="button" className="recipe-json-button" onClick={() => setJsonModalOpen(true)}>{'{ }'} Intégration JSON</button>}</div><p>Renseignez les ingrédients, les durées et les étapes de préparation.</p></div>
    {savedDraft && <div className="draft-restore-banner"><div><strong>Brouillon disponible</strong><p>Un brouillon est enregistré dans ce navigateur.</p></div><button type="button" onClick={restoreDraft}>Reprendre mon brouillon</button><button type="button" onClick={() => { clearDraft(); setSavedDraft(null); }}>Ignorer</button></div>}
    {draftMessage && <p className="draft-message" role="status">{draftMessage}</p>}
    <form onSubmit={submit} className="create-layout"><div className="create-form-main"><section className="create-card"><div className="create-card-title"><span>01</span><div><h2>Les informations essentielles</h2><p>Renseignez le nom, la description et la catégorie.</p></div></div><div className="form-grid"><label className="form-field form-full">Nom de la recette *<input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex. Gratin de légumes"/></label><label className="form-field form-full">Description *<textarea required rows={4} maxLength={600} value={description} onChange={event => setDescription(event.target.value)} placeholder="Présentation de la recette"/></label><SelectField className="form-field" label="Catégorie" value={category} onChange={value => setCategory(value)} options={[{ value: "Plats", label: "Plats" }, { value: "Entrées", label: "Entrées" }, { value: "Desserts", label: "Desserts" }, { value: "Petit-déjeuner", label: "Petit-déjeuner" }]}/><SelectField className="form-field" label="Difficulté" value={difficulty} onChange={setDifficulty} options={RECIPE_DIFFICULTIES.map(value => ({ value, label: value }))}/><label className="form-field form-full">URL de photo (facultatif)<input type="url" value={image.startsWith('data:') ? '' : image} onChange={event => setImage(event.target.value)} placeholder="https://exemple.com/ma-recette.jpg"/></label><div className="form-full"><ImagePicker label="Importer une photo" hasImage={Boolean(image.trim())} onChange={onPhoto}/></div>{photoError && <p className="form-error" role="alert">{photoError}</p>}{image && <button type="button" className="add-row-button photo-remove-button" onClick={() => setImage('')}>Retirer la photo</button>}</div></section>
      <section className="create-card"><div className="create-card-title"><span>02</span><div><h2>Temps et portions</h2><p>Indiquez les durées en minutes.</p></div></div><div className="form-grid form-triple"><label className="form-field">Préparation (min)<input type="number" min="0" max="1440" value={prep} onChange={event => setPrep(Math.max(0, Number(event.target.value) || 0))}/></label><label className="form-field">Cuisson (min)<input type="number" min="0" max="1440" value={cook} onChange={event => setCook(Math.max(0, Number(event.target.value) || 0))}/></label><label className="form-field">Personnes<input type="number" min="1" max="12" value={servings} onChange={event => setServings(Math.max(1, Math.min(12, Number(event.target.value) || 1)))}/></label><label className="form-field">Repos (min)<input type="number" min="0" max="1440" value={rest} onChange={event => setRest(Math.max(0, Number(event.target.value) || 0))}/></label><SelectField className="form-field" label="Budget" value={budget} onChange={value => setBudget(value)} options={[{ value: "Bon marché", label: "Bon marché" }, { value: "Moyen", label: "Moyen" }, { value: "Assez cher", label: "Assez cher" }]}/></div></section>
      <section className="create-card"><div className="create-card-title"><span>03</span><div><h2>Les ingrédients</h2><p>Les quantités sont indiquées pour {servings} personne{servings > 1 ? 's' : ''}.</p></div></div><div className="draft-list">{items.map((item, index) => <div key={item.id} className="draft-ingredient"><label className="form-field">Ingrédient {index + 1}<input required value={item.name} onChange={event => updateIngredient(item.id, 'name', event.target.value)} placeholder="Farine, tomate..."/></label><label className="form-field">Quantité<input type="number" min="0" step="any" value={item.amount} onChange={event => updateIngredient(item.id, 'amount', event.target.value)} placeholder="150"/></label><SelectField className="form-field" label="Unité" value={item.unit} onChange={value => updateIngredient(item.id, 'unit', value)} options={[{ value: "g", label: "g" }, { value: "kg", label: "kg" }, { value: "ml", label: "ml" }, { value: "l", label: "l" }, { value: "", label: "pièce(s)" }, { value: "c. à soupe", label: "c. à soupe" }, { value: "c. à café", label: "c. à café" }]}/><button type="button" className="draft-remove" disabled={items.length === 1} onClick={() => setItems(current => current.filter(row => row.id !== item.id))} aria-label={`Supprimer l'ingrédient ${index + 1}`}><Glyph name="trash" size={18}/></button></div>)}</div><button type="button" className="add-row-button" onClick={addIngredient}><Glyph name="plus" size={18}/>Ajouter un ingrédient</button></section>
      <section className="create-card"><div className="create-card-title"><span>04</span><div><h2>Les étapes de préparation</h2><p>Ajoutez les étapes dans l’ordre de préparation.</p></div></div><div className="draft-list">{steps.map((step,index) => <div className="draft-step" key={step.id}><span className="draft-step-index">{String(index+1).padStart(2,'0')}</span><label className="form-field"><span className="sr-only">Étape {index + 1}</span><textarea required rows={3} value={step.value} onChange={event => setSteps(current => current.map(item => item.id === step.id ? {...item,value:event.target.value} : item))} placeholder="Description de l’étape"/></label><button type="button" className="draft-remove" disabled={steps.length === 1} onClick={() => setSteps(current => current.filter(item => item.id !== step.id))} aria-label={`Supprimer l'étape ${index + 1}`}><Glyph name="trash" size={18}/></button></div>)}</div><button type="button" className="add-row-button" onClick={addStep}><Glyph name="plus" size={18}/>Ajouter une étape</button></section>
      <section className="create-card"><div className="create-card-title"><span>05</span><div><h2>Ustensiles</h2><p>Le matériel à prévoir pour cette recette.</p></div></div><div className="utensil-entry"><label className="form-field">Ajouter un ustensile<input value={utensilInput} onChange={event => setUtensilInput(event.target.value)} maxLength={70} placeholder="Ex. Fouet, four, casserole..." onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addUtensil(); } }}/></label><button type="button" className="add-row-button" onClick={addUtensil} disabled={!utensilInput.trim() || utensils.length >= 20}><Glyph name="plus" size={18}/>Ajouter</button></div><ul className="utensil-chip-list">{utensils.map(item => <li key={item}>{item}<button type="button" onClick={() => setUtensils(current => current.filter(value => value !== item))} aria-label={`Retirer ${item}`}>×</button></li>)}</ul></section>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="recipe-visibility"><span>Recette publique</span><ToggleSwitch label="Recette publique" checked={isPublic} onChange={setIsPublic}/></label>
      <div className="create-buttons"><a href="/recipes" onClick={event => {event.preventDefault();navigate('/recipes');}}>Annuler</a><button type="submit" disabled={saving}>{initialRecipe ? 'Enregistrer la recette' : 'Enregistrer ma recette'} <Glyph name="arrow" size={18}/></button></div>
    </div><aside className="create-sidebar"><div className="create-preview"><img src={(image === initialRecipe?.image ? initialPhoto : image.trim()) || demoImage} alt="Aperçu de la recette" onError={event => { event.currentTarget.src = demoImage; }}/><div><span className="card-category">Aperçu de la recette</span><h3>{title.trim() || 'Titre de la recette'}</h3><p>{description.trim() || 'Description de la recette'}</p><span><Glyph name="clock" size={16}/>{formatTime(prep + cook + rest)} · {servings} pers.</span></div></div><div className="draft-disclaimer"><strong>Enregistrement du brouillon</strong><p>Les nouvelles recettes sont enregistrées en brouillon dans ce navigateur. Les photos importées sont conservées lors de l’enregistrement de la recette.</p></div></aside></form>
  </div>{jsonModalOpen && <RecipeJsonModal recipe={exportRecipe} onImport={importRecipe} onClose={() => setJsonModalOpen(false)}/>}
  {pendingImport && <ConfirmDialog title="Importer cette recette ?" description="L'import remplacera les champs actuels du formulaire, sans enregistrer automatiquement la recette." confirmLabel="Remplir le formulaire" onConfirm={applyImportedRecipe} onCancel={() => setPendingImport(null)}/>}</main>;
}
