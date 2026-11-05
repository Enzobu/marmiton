import { useState, type FormEvent } from 'react';
import { BASE_SERVINGS, formatQuantity, ingredientQuantities, recipePath, recipePreparation, type Ingredient, type Recipe } from './recipe-data';
import './recipe-pages.css';

type Navigate = (path: string) => void;
type SharedProps = { navigate: Navigate; favorite: boolean; toggleFavorite: (id: number) => void };

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

function IngredientPicture({ icon }: { icon: Ingredient['icon'] }) {
  return <span className={`ingredient-picture ingredient-${icon}`} aria-hidden="true">
    <svg width="31" height="31" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {icon === 'vegetable' && <><path d="M16 9c-9-4-13 1-12 8 1 7 9 10 12 10s11-3 12-10c1-7-3-12-12-8Z"/><path d="M16 10c-3-6-1-8 2-8M16 12l-6-6m6 6 7-6"/></>}
      {icon === 'meat' && <><path d="M8 24c-4-4-2-10 3-15s12-5 15-1c4 4 1 11-4 15s-10 5-14 1Z"/><circle cx="18" cy="14" r="4"/></>}
      {icon === 'dairy' && <><path d="M10 7h12l2 20H8l2-20ZM11 7V3h10v4M9 14h14M13 20h6"/></>}
      {icon === 'grain' && <><path d="M16 28V4M16 9c-4 0-7-2-7-6m7 12c-5 0-9-3-9-7m9 13c-5 0-9-3-9-7m9-5c4 0 7-2 7-6m-7 12c5 0 9-3 9-7m-9 13c5 0 9-3 9-7"/></>}
      {icon === 'spice' && <><path d="M11 5h10M12 5v6l-6 8a5 5 0 0 0 9 5l7-10c2-3 0-7-4-7M8 22c3 1 5 0 7-2"/></>}
      {icon === 'other' && <><path d="M13 3h6v5l4 6v11c0 2-1 3-3 3H12c-2 0-3-1-3-3V14l4-6V3ZM9 17h14"/></>}
    </svg>
  </span>;
}

function formatTime(minutes: number) {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h${rest ? ` ${rest.toString().padStart(2, '0')}` : ''}` : `${minutes} min`;
}

export function RecipeDetail({ recipe, navigate, favorite, toggleFavorite }: { recipe: Recipe } & SharedProps) {
  const [servings, setServings] = useState(BASE_SERVINGS);
  const [checked, setChecked] = useState<string[]>([]);
  const [finishedSteps, setFinishedSteps] = useState<number[]>([]);
  const metadata = recipePreparation[recipe.id] ?? { prep: recipe.time, cook: 0, rest: 0, budget: 'Bon marché', utensils: ['Saladier', 'Couteau'] };
  const ingredients = ingredientQuantities[recipe.id] ?? recipe.ingredients.map(name => ({ name, amount: null, icon: 'other' as const }));
  return <main className="detail-page">
    <div className="detail-container">
      <nav className="breadcrumbs" aria-label="Fil d’Ariane"><a href="/" onClick={event => { event.preventDefault(); navigate('/'); }}>Accueil</a><span>/</span><a href="/recettes" onClick={event => { event.preventDefault(); navigate('/recettes'); }}>Recettes</a><span>/</span><span aria-current="page">{recipe.title}</span></nav>
      <div className="detail-intro"><div><span className="section-kicker">La recette du moment · {recipe.category}</span><h1>{recipe.title}</h1><p>{recipe.description}</p><div className="detail-rating"><Glyph name="star" size={17}/><strong>{recipe.rating.toFixed(1).replace('.', ',')} / 5</strong><span>· {recipe.reviews} avis de démonstration</span></div></div><div className="detail-actions"><button className={`detail-outline-button ${favorite ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(recipe.id)} aria-pressed={favorite}><Glyph name="heart"/>{favorite ? 'Dans mes favoris' : 'Sauvegarder'}</button><button className="detail-icon-button" onClick={() => window.print()} aria-label="Imprimer la recette" title="Imprimer"><Glyph name="print"/></button></div></div>
      <div className="detail-photo"><img src={recipe.image} alt={recipe.title}/><div className="detail-photo-note">Une recette à cuisiner avec amour</div></div>
      <div className="detail-stats" aria-label="Informations de la recette"><div><Glyph name="clock" size={22}/><span>Préparation</span><strong>{formatTime(metadata.prep)}</strong></div><div><Glyph name="clock" size={22}/><span>Cuisson</span><strong>{formatTime(metadata.cook)}</strong></div><div><Glyph name="clock" size={22}/><span>Repos</span><strong>{formatTime(metadata.rest)}</strong></div><div><Glyph name="chef" size={23}/><span>Difficulté</span><strong>{recipe.difficulty}</strong></div><div><Glyph name="wallet" size={22}/><span>Budget</span><strong>{metadata.budget}</strong></div></div>
      <div className="detail-columns">
        <aside className="ingredients-panel"><div className="panel-heading"><div><span className="section-kicker">Avant de commencer</span><h2>Ingrédients</h2></div><span className="panel-count">{ingredients.length} ingrédients</span></div>
          <div className="servings-control"><div><Glyph name="people" size={20}/><span>Pour combien de personnes ?</span></div><div className="servings-stepper"><button type="button" onClick={() => setServings(current => Math.max(1, current - 1))} disabled={servings <= 1} aria-label="Diminuer le nombre de personnes"><Glyph name="minus" size={17}/></button><output aria-live="polite">{servings}</output><button type="button" onClick={() => setServings(current => Math.min(12, current + 1))} disabled={servings >= 12} aria-label="Augmenter le nombre de personnes"><Glyph name="plus" size={17}/></button></div></div>
          <p className="panel-hint">Les quantités s’adaptent automatiquement au nombre de personnes.</p>
          <ul className="ingredient-list">{ingredients.map(ingredient => <li key={ingredient.name}><label className={checked.includes(ingredient.name) ? 'ingredient-checked' : ''}><input type="checkbox" checked={checked.includes(ingredient.name)} onChange={() => setChecked(current => current.includes(ingredient.name) ? current.filter(item => item !== ingredient.name) : [...current, ingredient.name])}/><IngredientPicture icon={ingredient.icon}/><span className="ingredient-description"><strong>{formatQuantity(ingredient, servings)}</strong><span>{ingredient.name}</span></span></label></li>)}</ul>
          <div className="utensil-block"><h3>Ustensiles</h3><ul>{metadata.utensils.map(item => <li key={item}><Glyph name="chef" size={17}/>{item}</li>)}</ul></div>
          <div className="panel-note"><strong>Petit conseil</strong><p>Coche tes ingrédients au fur et à mesure pour ne rien oublier.</p></div>
        </aside>
        <div className="preparation-panel"><span className="section-kicker">On passe en cuisine</span><h2>La préparation</h2><p className="preparation-lead">Suis les étapes une à une, et régale-toi !</p><div className="preparation-progress"><div><strong>{finishedSteps.length} / {recipe.steps.length}</strong> étapes terminées</div><div className="progress-track"><span style={{ width: `${recipe.steps.length ? 100 * finishedSteps.length / recipe.steps.length : 0}%` }}/></div></div>
          <ol className="step-list">{recipe.steps.map((step, index) => <li className={finishedSteps.includes(index) ? 'step-done' : ''} key={index}><button type="button" className="step-number" aria-label={finishedSteps.includes(index) ? `Marquer l’étape ${index + 1} non terminée` : `Marquer l’étape ${index + 1} terminée`} aria-pressed={finishedSteps.includes(index)} onClick={() => setFinishedSteps(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index])}>{finishedSteps.includes(index) ? <Glyph name="check" size={20}/> : (index + 1).toString().padStart(2, '0')}</button><div><h3>Étape {index + 1}</h3><p>{step}</p></div></li>)}</ol>
          <div className="detail-tip"><span className="tip-icon"><Glyph name="chef" size={24}/></span><div><strong>Le secret d'une bonne recette ?</strong><p>Prendre son temps, goûter et partager. À toi de jouer !</p></div></div>
        </div>
      </div>
      <div className="detail-bottom-nav"><a href="/recettes" onClick={event => { event.preventDefault(); navigate('/recettes'); }}><Glyph name="back"/>Retour aux recettes</a></div>
    </div>
  </main>;
}

type DraftIngredient = { id: number; name: string; amount: string; unit: string };
type DraftStep = { id: number; value: string };
const demoImage = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85';

export function RecipeCreate({ navigate, onCreate, initialRecipe }: { navigate: Navigate; onCreate: (recipe: Recipe, ingredients: Ingredient[], prep: number, cook: number) => void; initialRecipe?: Recipe }) {
  const [title, setTitle] = useState(initialRecipe?.title ?? '');
  const [description, setDescription] = useState(initialRecipe?.description ?? '');
  const [category, setCategory] = useState(initialRecipe?.category ?? 'Plats');
  const [difficulty, setDifficulty] = useState<'Facile' | 'Moyen'>(initialRecipe?.difficulty ?? 'Facile');
  const [prep, setPrep] = useState(recipePreparation[initialRecipe?.id ?? 0]?.prep ?? 15);
  const [cook, setCook] = useState(recipePreparation[initialRecipe?.id ?? 0]?.cook ?? 30);
  const [servings, setServings] = useState(4);
  const [image, setImage] = useState(initialRecipe?.image ?? '');
  const [items, setItems] = useState<DraftIngredient[]>(() => initialRecipe ? (ingredientQuantities[initialRecipe.id] ?? []).map((item, index) => ({ id: index + 1, name: item.name, amount: item.amount === null ? '' : String(item.amount), unit: item.unit ?? '' })) : [{ id: 1, name: '', amount: '', unit: 'g' }]);
  const [steps, setSteps] = useState<DraftStep[]>(() => initialRecipe ? initialRecipe.steps.map((value,index) => ({ id: index+100, value })) : [{ id: 100, value: '' }]);
  const [error, setError] = useState('');
  const [counter, setCounter] = useState(1000);
  const addIngredient = () => { setItems(value => [...value, { id: counter, name: '', amount: '', unit: 'g' }]); setCounter(value => value + 1); };
  const addStep = () => { setSteps(value => [...value, { id: counter, value: '' }]); setCounter(value => value + 1); };
  const updateIngredient = (id: number, field: 'name' | 'amount' | 'unit', value: string) => setItems(current => current.map(item => item.id === id ? { ...item, [field]: value } : item));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || items.some(item => !item.name.trim() || item.amount.trim() === '' || !Number.isFinite(Number(item.amount)) || Number(item.amount) < 0) || steps.some(item => !item.value.trim())) {
      setError('Complète le titre, la description, les ingrédients et toutes les étapes avant de continuer.'); return;
    }
    const id = initialRecipe?.id ?? Date.now();
    const recipe: Recipe = { id, title: title.trim(), description: description.trim(), category, difficulty, image: image.trim() || demoImage, time: prep + cook, rating: 0, reviews: 0, ingredients: items.map(item => item.name.trim()), steps: steps.map(item => item.value.trim()), badge: initialRecipe?.badge ?? 'Ma création' };
    onCreate(recipe, items.map(item => ({ name: item.name.trim(), amount: Number(item.amount) * BASE_SERVINGS / servings, unit: item.unit.trim() || undefined, icon: 'other' })), prep, cook);
    navigate(recipePath(id));
  };
  return <main className="create-page"><div className="detail-container"><nav className="breadcrumbs" aria-label="Fil d’Ariane"><a href="/" onClick={event => {event.preventDefault();navigate('/');}}>Accueil</a><span>/</span><a href="/recettes" onClick={event => {event.preventDefault();navigate('/recettes');}}>Recettes</a><span>/</span><span aria-current="page">{initialRecipe ? 'Modifier la recette' : 'Nouvelle recette'}</span></nav>
    <div className="create-heading"><span className="section-kicker">Ton carnet de cuisine</span><h1>{initialRecipe ? 'Modifie ta recette' : 'Partage ta recette'}</h1><p>Une bonne recette mérite d'être gardée. Remplis les informations ci-dessous pour créer ton brouillon.</p></div>
    <form onSubmit={submit} className="create-layout"><div className="create-form-main"><section className="create-card"><div className="create-card-title"><span>01</span><div><h2>Les informations essentielles</h2><p>Donne envie de passer à table.</p></div></div><div className="form-grid"><label className="form-field form-full">Nom de la recette *<input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex. Gratin de légumes de mamie"/></label><label className="form-field form-full">Description *<textarea required rows={4} maxLength={600} value={description} onChange={event => setDescription(event.target.value)} placeholder="Quelques mots pour présenter ta recette..."/></label><label className="form-field">Catégorie<select value={category} onChange={event => setCategory(event.target.value)}><option>Plats</option><option>Entrées</option><option>Desserts</option><option>Petit-déjeuner</option></select></label><label className="form-field">Difficulté<select value={difficulty} onChange={event => setDifficulty(event.target.value as 'Facile' | 'Moyen')}><option>Facile</option><option>Moyen</option></select></label><label className="form-field form-full">URL de photo (facultatif)<input type="url" value={image} onChange={event => setImage(event.target.value)} placeholder="https://exemple.com/ma-recette.jpg"/></label></div></section>
      <section className="create-card"><div className="create-card-title"><span>02</span><div><h2>Temps et portions</h2><p>Pour que chacun puisse s'organiser.</p></div></div><div className="form-grid form-triple"><label className="form-field">Préparation (min)<input type="number" min="0" max="1440" value={prep} onChange={event => setPrep(Math.max(0, Number(event.target.value) || 0))}/></label><label className="form-field">Cuisson (min)<input type="number" min="0" max="1440" value={cook} onChange={event => setCook(Math.max(0, Number(event.target.value) || 0))}/></label><label className="form-field">Personnes<input type="number" min="1" max="12" value={servings} onChange={event => setServings(Math.max(1, Math.min(12, Number(event.target.value) || 1)))}/></label></div></section>
      <section className="create-card"><div className="create-card-title"><span>03</span><div><h2>Les ingrédients</h2><p>Les quantités sont indiquées pour {servings} personne{servings > 1 ? 's' : ''}.</p></div></div><div className="draft-list">{items.map((item, index) => <div key={item.id} className="draft-ingredient"><label className="form-field">Ingrédient {index + 1}<input required value={item.name} onChange={event => updateIngredient(item.id, 'name', event.target.value)} placeholder="Farine, tomate..."/></label><label className="form-field">Quantité<input required type="number" min="0" step="any" value={item.amount} onChange={event => updateIngredient(item.id, 'amount', event.target.value)} placeholder="150"/></label><label className="form-field">Unité<select value={item.unit} onChange={event => updateIngredient(item.id, 'unit', event.target.value)}><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="l">l</option><option value="">pièce(s)</option><option value="c. à soupe">c. à soupe</option><option value="c. à café">c. à café</option></select></label><button type="button" className="draft-remove" disabled={items.length === 1} onClick={() => setItems(current => current.filter(row => row.id !== item.id))} aria-label={`Supprimer l'ingrédient ${index + 1}`}><Glyph name="trash" size={18}/></button></div>)}</div><button type="button" className="add-row-button" onClick={addIngredient}><Glyph name="plus" size={18}/>Ajouter un ingrédient</button></section>
      <section className="create-card"><div className="create-card-title"><span>04</span><div><h2>Les étapes de préparation</h2><p>Une étape après l'autre, tout simplement.</p></div></div><div className="draft-list">{steps.map((step,index) => <div className="draft-step" key={step.id}><span className="draft-step-index">{String(index+1).padStart(2,'0')}</span><label className="form-field"><span className="sr-only">Étape {index + 1}</span><textarea required rows={3} value={step.value} onChange={event => setSteps(current => current.map(item => item.id === step.id ? {...item,value:event.target.value} : item))} placeholder="Décris cette étape..."/></label><button type="button" className="draft-remove" disabled={steps.length === 1} onClick={() => setSteps(current => current.filter(item => item.id !== step.id))} aria-label={`Supprimer l'étape ${index + 1}`}><Glyph name="trash" size={18}/></button></div>)}</div><button type="button" className="add-row-button" onClick={addStep}><Glyph name="plus" size={18}/>Ajouter une étape</button></section>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="create-buttons"><a href="/recettes" onClick={event => {event.preventDefault();navigate('/recettes');}}>Annuler</a><button type="submit">{initialRecipe ? 'Enregistrer la recette' : 'Prévisualiser ma recette'} <Glyph name="arrow" size={18}/></button></div>
    </div><aside className="create-sidebar"><div className="create-preview"><img src={image.trim() || demoImage} alt="Aperçu de la recette" onError={event => { event.currentTarget.src = demoImage; }}/><div><span className="card-category">Ma prochaine recette</span><h3>{title.trim() || 'Le titre de ta recette'}</h3><p>{description.trim() || 'Ta description apparaîtra ici...'}</p><span><Glyph name="clock" size={16}/>{formatTime(prep + cook)} · {servings} pers.</span></div></div><div className="draft-disclaimer"><strong>Mode démonstration</strong><p>Cette création reste dans la session du navigateur. L'enregistrement et la publication arriveront avec l'API et les comptes.</p></div></aside></form>
  </div></main>;
}
