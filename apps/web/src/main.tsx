import React, { useEffect, useMemo, useState } from 'react';
import { recipes, ingredientQuantities, recipePreparation, recipePath, type Recipe, type Ingredient } from './recipe-data';
import { RecipeDetail, RecipeCreate } from './RecipePages';
import { AuthPage, AUTH_ROUTES, type DemoUser } from './AuthPages';
import { AccountPage, type Profile, type AccountRoute } from './AccountPages';
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
    <a className="recipe-image-button" href={recipePath(recipe.id)} onClick={event => { event.preventDefault(); onOpen(recipe); }} aria-label={`Voir la recette ${recipe.title}`}>
      <img src={recipe.image} alt={recipe.title} loading="lazy" />
      {recipe.badge && <span className="recipe-badge">{recipe.badge}</span>}
    </a>
    <button className={`favorite ${saved ? 'active' : ''}`} onClick={() => onToggle(recipe.id)} aria-label={saved ? `Retirer ${recipe.title} des favoris` : `Ajouter ${recipe.title} aux favoris`} aria-pressed={saved}><Icon name="heart" size={20}/></button>
    <div className="card-content">
      <span className="card-category">{recipe.category}</span>
      <a className="card-title-button" href={recipePath(recipe.id)} onClick={event => { event.preventDefault(); onOpen(recipe); }}><h3>{recipe.title}</h3></a>
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
  const [demoUser, setDemoUser] = useState<Profile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
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
  const detailId = /^\/recipes\/(\d+)$/.exec(path)?.[1];
  const editId = /^\/recipes\/(\d+)\/edit$/.exec(path)?.[1];
  const editRecipe = editId ? createdRecipes.find(recipe => recipe.id === Number(editId)) : undefined;
  const accountRoute = ({ '/profile': 'profile', '/my-recipes': 'my-recipes', '/favorites': 'favorites' } as Record<string, AccountRoute>)[path];
  const selectedRecipe = detailId ? allRecipes.find(recipe => recipe.id === Number(detailId)) : undefined;
  const isHome = path === '/';
  const isCatalog = path === '/recipes';
  const isCreate = path === '/recipes/new';
  const authPage = (Object.entries(AUTH_ROUTES).find(([, value]) => value === path)?.[0] ?? null) as keyof typeof AUTH_ROUTES | null;
  const isNotFound = !isHome && !isCatalog && !isCreate && !selectedRecipe && !authPage && !accountRoute && !editRecipe;
  const addCreatedRecipe = (recipe: Recipe, ingredients: Ingredient[], prep: number, cook: number) => {
    ingredientQuantities[recipe.id] = ingredients;
    recipePreparation[recipe.id] = { prep, cook, rest: 0, budget: 'Non renseigné', utensils: [] };
    setCreatedRecipes(current => [recipe, ...current.filter(item => item.id !== recipe.id)]);
  };
  const deleteCreatedRecipe = (id: number) => {
    setCreatedRecipes(current => current.filter(recipe => recipe.id !== id));
    setFavorites(current => current.filter(value => value !== id));
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => allRecipes.filter(recipe => {
    const haystack = [recipe.title, recipe.description, recipe.category, ...recipe.ingredients].join(' ').toLocaleLowerCase('fr');
    return haystack.includes(search.trim().toLocaleLowerCase('fr')) && (category === 'Toutes les recettes' || recipe.category === category) && (!onlyFavorites || favorites.includes(recipe.id));
  }), [search, category, onlyFavorites, favorites, allRecipes]);

  const visible = (isCatalog || search || category !== 'Toutes les recettes' || onlyFavorites || showAll) ? filtered : filtered.slice(0, 6);
  const toggleFavorite = (id: number) => setFavorites(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const chooseCategory = (value: string) => { setCategory(value); setOnlyFavorites(false); setShowAll(true); setMenuOpen(false); navigate('/recipes'); };
  const openFavorites = () => { setOnlyFavorites(false); setCategory('Toutes les recettes'); setShowAll(true); setMenuOpen(false); navigate('/favorites'); };
  const reset = () => { setSearch(''); setCategory('Toutes les recettes'); setOnlyFavorites(false); setShowAll(false); setMenuOpen(false); navigate('/'); };
  const browse = () => { setSearch(''); setCategory('Toutes les recettes'); setOnlyFavorites(false); setShowAll(true); setMenuOpen(false); navigate('/recipes'); };
  const openRecipe = (recipe: Recipe) => navigate(recipePath(recipe.id));

  return <>
    <div className="top-announcement"><span>Les bonnes recettes se partagent, tout simplement</span></div>
    <header className="site-header">
      <div className="header-inner">
        <button className="logo" onClick={reset} aria-label="Accueil Les Petits Plats"><span className="logo-mark"><Icon name="chef" size={25}/></span><span>les petits<span className="logo-accent">plats.</span></span></button>
        <nav className="desktop-navigation" aria-label="Navigation principale">
          <button onClick={reset}>Accueil</button><button onClick={browse}>Recettes</button><button onClick={openFavorites}>Mes favoris</button><button onClick={() => { setMenuOpen(false); navigate("/recipes/new"); }}>Créer une recette</button>
        </nav>
        <div className="header-actions"><button className="header-favorites" onClick={openFavorites} aria-label="Afficher mes favoris"><Icon name="heart" size={21}/>{favorites.length > 0 && <span className="fav-counter">{favorites.length}</span>}</button>{demoUser ? <div className="profile-menu-wrap">
          <button className="profile-trigger" aria-expanded={profileOpen} aria-haspopup="true" onClick={() => setProfileOpen(current => !current)}>
            <span className="profile-avatar">{demoUser.avatar ? <img src={demoUser.avatar} alt="Photo de profil" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/> : (demoUser.firstName.charAt(0) + demoUser.lastName.charAt(0)).toUpperCase()}</span><span>{demoUser.firstName}</span>
          </button>
          {profileOpen && <div className="profile-dropdown">
            <div className="profile-dropdown-head"><strong>{demoUser.firstName} {demoUser.lastName}</strong><span>{demoUser.email}</span></div>
            <button onClick={() => { setProfileOpen(false); navigate('/profile'); }}>Mon profil</button>
            <button onClick={() => { setProfileOpen(false); navigate('/my-recipes'); }}>Mes recettes</button>
            <button onClick={() => { setProfileOpen(false); openFavorites(); }}>Mes favoris</button>
            <button onClick={() => { setProfileOpen(false); navigate('/recipes/new'); }}>Créer une recette</button>
            <button onClick={() => { setDemoUser(null); setProfileOpen(false); navigate('/'); }}>Se déconnecter</button>
            <span className="profile-demo-tag">Compte de démonstration, non persistant</span>
          </div>}
        </div> : <button className="signin-button" onClick={() => navigate('/login')}><Icon name="user" size={17}/>Connexion</button>}<button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Ouvrir le menu"><Icon name={menuOpen ? 'close' : 'menu'} /></button></div>
      </div>
      {menuOpen && <nav className="mobile-navigation" aria-label="Navigation mobile"><button onClick={reset}>Accueil</button><button onClick={browse}>Recettes</button><button onClick={openFavorites}>Mes favoris</button><button onClick={() => { setMenuOpen(false); navigate("/recipes/new"); }}>Créer une recette</button></nav>}
    </header>
    {(isHome || isCatalog) && <main>
      {isHome && <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/> La cuisine qui rassemble</span><h1>Chaque recette<br/>a sa petite <em>histoire.</em></h1><p>Des idées gourmandes, des recettes testées et surtout beaucoup de plaisir à cuisiner. Qu'est-ce qu'on prépare aujourd'hui ?</p>
            <form className="hero-search" onSubmit={event => { event.preventDefault(); navigate('/recipes'); }}><Icon name="search" size={23}/><label className="sr-only" htmlFor="recipe-search">Chercher une recette ou un ingrédient</label><input id="recipe-search" value={search} onChange={event => { setSearch(event.target.value); setShowAll(true); }} placeholder="Une recette, un ingrédient..." /><button type="submit">Rechercher <Icon name="arrow" size={17}/></button></form>
            <div className="popular-searches"><strong>À essayer :</strong><button onClick={() => { setSearch('chocolat'); setShowAll(true); navigate('/recipes'); }}>Chocolat</button><button onClick={() => { setSearch('poulet'); setShowAll(true); navigate('/recipes'); }}>Poulet</button><button onClick={() => { setSearch('pâtes'); setShowAll(true); navigate('/recipes'); }}>Pâtes</button></div>
          </div>
          <div className="hero-visual"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?w=1300&q=90" alt="Plat gourmand à partager" /><div className="hero-stamp"><span>Fait avec</span><Icon name="heart" size={28}/><span>à la maison</span></div></div>
        </div>
      </section>
      <section className="categories-section section-container" aria-labelledby="categories-title"><div className="section-heading"><div><span className="section-kicker">Une envie particulière ?</span><h2 id="categories-title">Qu'est-ce qui te ferait plaisir ?</h2></div><p>Il y a toujours une bonne raison de se régaler.</p></div><div className="category-grid">{categories.slice(1).map(item => <button key={item} className={`category-tile ${category === item && !onlyFavorites ? 'selected' : ''}`} onClick={() => chooseCategory(item)}><span className="category-emoji" aria-hidden="true">{categoryInitials[item]}</span><span>{item}</span><Icon name="arrow" size={17}/></button>)}</div></section></>}
      {isCatalog && <section className="catalog-intro"><span className="section-kicker">Toutes les bonnes idées</span><h1>À chaque envie, sa recette.</h1><p>Un petit creux, une grande occasion ou simplement envie de cuisiner ? Explore notre carnet et trouve de quoi régaler tout le monde.</p><form className="hero-search catalog-search" onSubmit={event => event.preventDefault()}><Icon name="search" size={21}/><label className="sr-only" htmlFor="catalog-search">Chercher une recette</label><input id="catalog-search" placeholder="Une recette, un ingrédient..." value={search} onChange={event => setSearch(event.target.value)}/><button type="submit">Rechercher <Icon name="arrow" size={17}/></button></form></section>}
      {(isHome || isCatalog) && <section id="recipes" className={isCatalog ? "recipes-section section-container catalog-recipes" : "recipes-section section-container"} aria-labelledby="recipes-title"><div className="section-heading recipes-heading"><div><span className="section-kicker">{onlyFavorites ? 'Ma sélection' : 'Des idées pour se régaler'}</span><h2 id="recipes-title">{onlyFavorites ? 'Mes recettes favorites' : search ? 'Résultats de recherche' : category === 'Toutes les recettes' ? 'Nos recettes à découvrir' : category}</h2></div><span className="recipe-count">{filtered.length} recette{filtered.length > 1 ? 's' : ''}</span></div>
        <div className="filter-bar"><div className="filter-chips" role="group" aria-label="Filtrer les recettes"><button className={category === 'Toutes les recettes' && !onlyFavorites ? 'active' : ''} onClick={() => { setOnlyFavorites(false); setCategory('Toutes les recettes'); }}>Tout voir</button>{categories.slice(1).map(item => <button key={item} className={!onlyFavorites && category === item ? 'active' : ''} onClick={() => { setCategory(item); setOnlyFavorites(false); }}>{item}</button>)}<button className={onlyFavorites ? 'active' : ''} onClick={openFavorites}><Icon name="heart" size={14}/>Favoris</button></div><span className="filter-caption"><Icon name="sliders" size={17}/> Trouve ton bonheur</span></div>
        {visible.length ? <div className="recipe-grid">{visible.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} saved={favorites.includes(recipe.id)} onToggle={toggleFavorite} onOpen={openRecipe}/>)}</div> : <div className="empty-state"><Icon name="search" size={30}/><h3>Aucune recette trouvée</h3><p>Essaie une autre recherche ou modifie tes filtres.</p><button onClick={() => { setSearch(''); setCategory('Toutes les recettes'); setOnlyFavorites(false); }}>Voir toutes les recettes</button></div>}
        {filtered.length > visible.length && <div className="see-more"><button onClick={() => setShowAll(true)}>Découvrir toutes les recettes <Icon name="arrow" size={17}/></button></div>}
      </section>}
      {isHome && <section className="newsletter-section"><div className="newsletter-inner"><div className="newsletter-deco" aria-hidden="true"><Icon name="chef" size={72}/></div><div><span className="section-kicker">Cuisiner, c'est partager</span><h2>Les meilleures histoires commencent autour d'une table.</h2><p>Garde tes recettes préférées sous la main et fais le plein d'idées gourmandes.</p></div><button onClick={() => navigate("/recipes/new")}><Icon name="plus" size={19}/> Ajouter une recette</button></div></section>}
    </main>}
    {selectedRecipe && <RecipeDetail key={selectedRecipe.id} recipe={selectedRecipe} navigate={navigate} favorite={favorites.includes(selectedRecipe.id)} toggleFavorite={toggleFavorite}/>}
    {isCreate && <RecipeCreate navigate={navigate} onCreate={addCreatedRecipe}/>}
    {editRecipe && <RecipeCreate key={editRecipe.id} initialRecipe={editRecipe} navigate={navigate} onCreate={addCreatedRecipe}/>}
    {authPage && <AuthPage key={authPage} page={authPage} navigate={navigate} onDemoLogin={(user: DemoUser) => { setDemoUser({ ...user, bio: "", newsletter: false, publicRecipes: true }); setProfileOpen(false); navigate("/"); }}/>}
    {accountRoute && <AccountPage key={accountRoute + (demoUser?.email ?? 'guest')} page={accountRoute} profile={demoUser} recipes={allRecipes} myRecipes={createdRecipes} favorites={favorites} navigate={navigate} onProfileChange={setDemoUser} onFavoriteToggle={toggleFavorite} onDeleteRecipe={deleteCreatedRecipe}/>}
    {isNotFound && <main className="not-found-page"><h1>Cette recette est introuvable</h1><p>Elle n'existe pas dans notre carnet de démonstration.</p><button onClick={browse}>Voir les recettes</button></main>}
    <footer className="site-footer"><div><span className="footer-brand">les petits<span>plats.</span></span><p>De bonnes idées, de bons petits plats.</p></div><span>Fait maison, avec amour.</span></footer>

  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
