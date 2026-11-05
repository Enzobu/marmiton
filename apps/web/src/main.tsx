import React, { useEffect, useMemo, useState } from 'react';
import { recipes, ingredientQuantities, recipePath, type Recipe, type Ingredient } from './recipe-data';
import { RecipeDetail, RecipeCreate } from './RecipePages';
import { createRoot } from 'react-dom/client';
import './styles.css';

const categories = ['Toutes les recettes', 'Entrées', 'Plats', 'Desserts', 'Petit-déjeuner'];
const categoryInitials: Record<string, string> = { 'Entrées': 'E', 'Plats': 'P', 'Desserts': 'D', 'Petit-déjeuner': 'PD' };

function Icon({ name, size = 20 }: { name: 'search' | 'heart' | 'clock' | 'star' | 'user' | 'menu' | 'close' | 'arrow' | 'sliders' | 'chef' | 'plus'; size?: number }) {
  const paths: Record<typeof name, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    star: <path d="m12 2 3.1 6.4 7 .9-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7L2 9.3l7-.9L12 2Z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.3-7 8-7s8 2.5 8 7"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <path d="M5 5 19 19M19 5 5 19"/>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    sliders: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="var(--color-paper)"/><circle cx="16" cy="17" r="2" fill="var(--color-paper)"/></>,
    chef: <><path d="M6 13a4 4 0 0 1-1-7 5 5 0 0 1 9-2 4 4 0 1 1 5 8v7H6Z"/><path d="M6 17h13"/></>,
    plus: <path d="M12 5v14M5 12h14"/>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function RecipeCard({ recipe, saved, onToggle, onOpen }: { recipe: Recipe; saved: boolean; onToggle: (id: number) => void; onOpen: (recipe: Recipe) => void }) {
  return <article className="recipe-card">
    <button className="recipe-image-button" onClick={() => onOpen(recipe)} aria-label={`Voir la recette ${recipe.title}`}>
      <img src={recipe.image} alt={recipe.title} loading="lazy" />
      {recipe.badge && <span className="recipe-badge">{recipe.badge}</span>}
    </button>
    <button className={`favorite ${saved ? 'active' : ''}`} onClick={() => onToggle(recipe.id)} aria-label={saved ? `Retirer ${recipe.title} des favoris` : `Ajouter ${recipe.title} aux favoris`} aria-pressed={saved}><Icon name="heart" size={20}/></button>
    <div className="card-content">
      <span className="card-category">{recipe.category}</span>
      <button className="card-title-button" onClick={() => onOpen(recipe)}><h3>{recipe.title}</h3></button>
      <div className="card-meta"><span className="rating"><Icon name="star" size={15}/>{recipe.rating.toFixed(1)} <span className="reviews">({recipe.reviews})</span></span><span><Icon name="clock" size={15}/>{recipe.time} min</span></div>
    </div>
  </article>;
}

function App() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Toutes les recettes');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);
  const [path, setPath] = useState(window.location.pathname);
  const navigate = (next: string) => {
    if (window.location.pathname !== next) window.history.pushState(null, '', next);
    setPath(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const allRecipes = useMemo(() => [...createdRecipes, ...recipes], [createdRecipes]);
  const detailId = /^\/recettes\/(\d+)$/.exec(path)?.[1];
  const selectedRecipe = detailId ? allRecipes.find(recipe => recipe.id === Number(detailId)) : undefined;
  const isHome = path === '/';
  const isCatalog = path === '/recettes';
  const isCreate = path === '/recettes/nouvelle';
  const isNotFound = !isHome && !isCatalog && !isCreate && !selectedRecipe;
  const addCreatedRecipe = (recipe: Recipe, ingredients: Ingredient[]) => {
    ingredientQuantities[recipe.id] = ingredients;
    setCreatedRecipes(current => [recipe, ...current]);
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => allRecipes.filter(recipe => {
    const haystack = [recipe.title, recipe.description, recipe.category, ...recipe.ingredients].join(' ').toLocaleLowerCase('fr');
    return haystack.includes(search.trim().toLocaleLowerCase('fr')) && (category === 'Toutes les recettes' || recipe.category === category) && (!onlyFavorites || favorites.includes(recipe.id));
  }), [search, category, onlyFavorites, favorites, allRecipes]);

  const visible = (search || category !== 'Toutes les recettes' || onlyFavorites || showAll) ? filtered : filtered.slice(0, 6);
  const toggleFavorite = (id: number) => setFavorites(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const chooseCategory = (value: string) => { setCategory(value); setOnlyFavorites(false); setShowAll(true); setMenuOpen(false); navigate('/recettes'); };
  const openFavorites = () => { setOnlyFavorites(true); setCategory('Toutes les recettes'); setShowAll(true); setMenuOpen(false); navigate('/recettes'); };
  const reset = () => { setSearch(''); setCategory('Toutes les recettes'); setOnlyFavorites(false); setShowAll(false); setMenuOpen(false); navigate('/'); };
  const browse = () => { setSearch(''); setCategory('Toutes les recettes'); setOnlyFavorites(false); setShowAll(true); setMenuOpen(false); navigate('/recettes'); };
  const openRecipe = (recipe: Recipe) => navigate(recipePath(recipe.id));

  return <>
    <div className="top-announcement"><span>Les bonnes recettes se partagent, tout simplement</span></div>
    <header className="site-header">
      <div className="header-inner">
        <button className="logo" onClick={reset} aria-label="Accueil Les Petits Plats"><span className="logo-mark"><Icon name="chef" size={25}/></span><span>les petits<span className="logo-accent">plats.</span></span></button>
        <nav className="desktop-navigation" aria-label="Navigation principale">
          <button onClick={reset}>Accueil</button><button onClick={() => chooseCategory('Plats')}>Recettes</button><button onClick={openFavorites}>Mes favoris</button>
        </nav>
        <div className="header-actions"><button className="header-favorites" onClick={openFavorites} aria-label="Afficher mes favoris"><Icon name="heart" size={21}/>{favorites.length > 0 && <span className="fav-counter">{favorites.length}</span>}</button><button className="signin-button" disabled title="Disponible après l'intégration de l'authentification"><Icon name="user" size={17}/>Connexion</button><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Ouvrir le menu"><Icon name={menuOpen ? 'close' : 'menu'} /></button></div>
      </div>
      {menuOpen && <nav className="mobile-navigation" aria-label="Navigation mobile"><button onClick={reset}>Accueil</button><button onClick={() => chooseCategory('Plats')}>Recettes</button><button onClick={openFavorites}>Mes favoris</button></nav>}
    </header>
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/> La cuisine qui rassemble</span><h1>Chaque recette<br/>a sa petite <em>histoire.</em></h1><p>Des idées gourmandes, des recettes testées et surtout beaucoup de plaisir à cuisiner. Qu'est-ce qu'on prépare aujourd'hui ?</p>
            <form className="hero-search" onSubmit={event => { event.preventDefault(); document.getElementById('recipes')?.scrollIntoView({ behavior: 'smooth' }); }}><Icon name="search" size={23}/><label className="sr-only" htmlFor="recipe-search">Chercher une recette ou un ingrédient</label><input id="recipe-search" value={search} onChange={event => { setSearch(event.target.value); setShowAll(true); }} placeholder="Une recette, un ingrédient..." /><button type="submit">Rechercher <Icon name="arrow" size={17}/></button></form>
            <div className="popular-searches"><strong>À essayer :</strong><button onClick={() => { setSearch('chocolat'); setShowAll(true); }}>Chocolat</button><button onClick={() => { setSearch('poulet'); setShowAll(true); }}>Poulet</button><button onClick={() => { setSearch('pâtes'); setShowAll(true); }}>Pâtes</button></div>
          </div>
          <div className="hero-visual"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?w=1300&q=90" alt="Plat gourmand à partager" /><div className="hero-stamp"><span>Fait avec</span><Icon name="heart" size={28}/><span>à la maison</span></div></div>
        </div>
      </section>
      <section className="categories-section section-container" aria-labelledby="categories-title"><div className="section-heading"><div><span className="section-kicker">Une envie particulière ?</span><h2 id="categories-title">Qu'est-ce qui te ferait plaisir ?</h2></div><p>Il y a toujours une bonne raison de se régaler.</p></div><div className="category-grid">{categories.slice(1).map(item => <button key={item} className={`category-tile ${category === item && !onlyFavorites ? 'selected' : ''}`} onClick={() => chooseCategory(item)}><span className="category-emoji" aria-hidden="true">{categoryInitials[item]}</span><span>{item}</span><Icon name="arrow" size={17}/></button>)}</div></section>
      <section id="recipes" className="recipes-section section-container" aria-labelledby="recipes-title"><div className="section-heading recipes-heading"><div><span className="section-kicker">{onlyFavorites ? 'Ma sélection' : 'Des idées pour se régaler'}</span><h2 id="recipes-title">{onlyFavorites ? 'Mes recettes favorites' : search ? 'Résultats de recherche' : category === 'Toutes les recettes' ? 'Nos recettes à découvrir' : category}</h2></div><span className="recipe-count">{filtered.length} recette{filtered.length > 1 ? 's' : ''}</span></div>
        <div className="filter-bar"><div className="filter-chips" role="group" aria-label="Filtrer les recettes"><button className={category === 'Toutes les recettes' && !onlyFavorites ? 'active' : ''} onClick={() => { setOnlyFavorites(false); setCategory('Toutes les recettes'); }}>Tout voir</button>{categories.slice(1).map(item => <button key={item} className={!onlyFavorites && category === item ? 'active' : ''} onClick={() => { setCategory(item); setOnlyFavorites(false); }}>{item}</button>)}<button className={onlyFavorites ? 'active' : ''} onClick={openFavorites}><Icon name="heart" size={14}/>Favoris</button></div><span className="filter-caption"><Icon name="sliders" size={17}/> Trouve ton bonheur</span></div>
        {visible.length ? <div className="recipe-grid">{visible.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} saved={favorites.includes(recipe.id)} onToggle={toggleFavorite} onOpen={setSelected}/>)}</div> : <div className="empty-state"><Icon name="search" size={30}/><h3>Aucune recette trouvée</h3><p>Essaie une autre recherche ou modifie tes filtres.</p><button onClick={() => { setSearch(''); setCategory('Toutes les recettes'); setOnlyFavorites(false); }}>Voir toutes les recettes</button></div>}
        {filtered.length > visible.length && <div className="see-more"><button onClick={() => setShowAll(true)}>Découvrir toutes les recettes <Icon name="arrow" size={17}/></button></div>}
      </section>
      <section className="newsletter-section"><div className="newsletter-inner"><div className="newsletter-deco" aria-hidden="true"><Icon name="chef" size={72}/></div><div><span className="section-kicker">Cuisiner, c'est partager</span><h2>Les meilleures histoires commencent autour d'une table.</h2><p>Garde tes recettes préférées sous la main et fais le plein d'idées gourmandes.</p></div><button disabled title="Disponible après l'intégration des comptes"><Icon name="plus" size={19}/> Ajouter une recette <span className="soon-tag">Bientôt</span></button></div></section>
    </main>
    <footer className="site-footer"><div><span className="footer-brand">les petits<span>plats.</span></span><p>De bonnes idées, de bons petits plats.</p></div><span>Fait maison, avec amour.</span></footer>
    {selected && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}><div className="recipe-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" onClick={() => setSelected(null)} aria-label="Fermer la recette"><Icon name="close"/></button><img src={selected.image} alt={selected.title}/><div className="modal-content"><span className="card-category">{selected.category}</span><h2 id="modal-title">{selected.title}</h2><p>{selected.description}</p><div className="modal-meta"><span><Icon name="clock" size={17}/>{selected.time} min</span><span><Icon name="star" size={17}/>{selected.rating.toFixed(1)}</span><span>{selected.difficulty}</span></div><h3>Ingrédients</h3><ul>{selected.ingredients.map(item => <li key={item}>{item}</li>)}</ul><h3>Préparation</h3><ol>{selected.steps.map(item => <li key={item}>{item}</li>)}</ol><button className="modal-favorite" onClick={() => toggleFavorite(selected.id)}><Icon name="heart" size={18}/>{favorites.includes(selected.id) ? 'Retirer des favoris' : 'Garder cette recette'}</button><p className="demo-notice">Recette de démonstration : l’enregistrement viendra avec l’API.</p></div></div></div>}
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
