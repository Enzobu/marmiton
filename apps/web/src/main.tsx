import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ingredientQuantities, recipePreparation, recipePath, type Recipe, type Ingredient } from './recipe-data';
import { RecipeDetail, RecipeCreate } from './RecipePages';
import { parseCatalogQuery, serializeCatalogQuery, type CatalogFilters, type CatalogSort } from './recipe-search';
import { AuthPage, AUTH_ROUTES } from './AuthPages';
import { AccountPage, type Profile, type AccountRoute } from './AccountPages';
import { NotFoundPage, ToastRegion, type ToastMessage } from './UiFeedback';
import { apiRequest, ApiError, fromApiRecipe, type ApiRecipe, type CatalogPage } from './api';
import { readSession, saveSession } from './session';
import { ThemeToggle, type ThemePreference } from './ThemeToggle';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './dark.css';

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

function RecipeCard({ recipe, saved, onToggle, onOpen }: { recipe: Recipe; saved: boolean; onToggle: (id: Recipe['id']) => void; onOpen: (recipe: Recipe) => void }) {
  const [imageReady, setImageReady] = useState(false);
  return <article className="recipe-card">
    <a className={`recipe-image-button ${imageReady || !recipe.image ? "image-ready" : ""}`} aria-busy={Boolean(recipe.image) && !imageReady} href={recipePath(recipe.id)} onClick={event => { event.preventDefault(); onOpen(recipe); }} aria-label={`Voir la recette ${recipe.title}`}>
      {recipe.image && <img src={recipe.image} alt={recipe.title} loading="lazy" onLoad={() => setImageReady(true)} onError={() => setImageReady(true)}/>}
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
  const [search, setSearch] = useState(() => parseCatalogQuery(window.location.search).query);
  const [category, setCategory] = useState(() => parseCatalogQuery(window.location.search).category);
  const [difficultyFilter, setDifficultyFilter] = useState<CatalogFilters['difficulty']>(() => parseCatalogQuery(window.location.search).difficulty);
  const [budgetFilter, setBudgetFilter] = useState<CatalogFilters['budget']>(() => parseCatalogQuery(window.location.search).budget);
  const [maxTimeFilter, setMaxTimeFilter] = useState<number | null>(() => parseCatalogQuery(window.location.search).maxTime);
  const [sortFilter, setSortFilter] = useState<CatalogSort>(() => parseCatalogQuery(window.location.search).sort);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Recipe['id'][]>([]);
  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastId = useRef(0);
  const notify = (message: string, type: ToastMessage['type'] = 'success') => {
    setToast({ id: ++toastId.current, message, type });
  };
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessToken, setAccessToken] = useState(readSession);
  const [sessionPending, setSessionPending] = useState(Boolean(accessToken));
  const [sessionError, setSessionError] = useState(false);
  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    apiRequest<Profile>('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal })
      .then(user => { setProfile(user); setSessionError(false); })
      .catch(error => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          saveSession(null);
          setProfile(null);
          setAccessToken(null);
        } else { setSessionError(true); }
      })
      .finally(() => { if (!controller.signal.aborted) setSessionPending(false); });
    return () => controller.abort();
  }, [accessToken]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!profileOpen) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileOpen]);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    try { const stored = window.localStorage.getItem('petitsplats.theme'); return stored === 'light' || stored === 'dark' ? stored : 'system'; }
    catch { return 'system'; }
  });
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = themePreference === 'dark' || (themePreference === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#161b18' : '#fffdf9');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [themePreference]);
  const updateThemePreference = (value: ThemePreference) => {
    setThemePreference(value);
    try { window.localStorage.setItem('petitsplats.theme', value); } catch { /* Storage can be blocked. */ }
  };
  const [developerMode, setDeveloperMode] = useState(() => {
    try { return window.localStorage.getItem('petitsplats.developerMode') === 'true'; }
    catch { return false; }
  });
  const toggleDeveloperMode = (enabled: boolean) => {
    setDeveloperMode(enabled);
    try { window.localStorage.setItem('petitsplats.developerMode', String(enabled)); } catch { /* Storage unavailable. */ }
  };
  const [path, setPath] = useState(window.location.pathname);
  const navigate = (next: string) => {
    setProfileOpen(false);
    if (window.location.pathname !== next) window.history.pushState(null, '', next);
    setPath(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  useEffect(() => {
    if (!sessionPending && !sessionError && !profile && ['/favorites', '/profile', '/my-recipes'].includes(path)) navigate('/login');
  }, [path, profile, sessionPending, sessionError]);
  useEffect(() => {
    const onPop = () => {
      setProfileOpen(false);
      setPath(window.location.pathname);
      if (window.location.pathname === '/recipes') {
        const parsed = parseCatalogQuery(window.location.search);
        setSearch(parsed.query); setCategory(parsed.category);
        setDifficultyFilter(parsed.difficulty); setBudgetFilter(parsed.budget);
        setMaxTimeFilter(parsed.maxTime); setSortFilter(parsed.sort);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const catalogFilters: CatalogFilters = { query: search, category, difficulty: difficultyFilter, budget: budgetFilter, maxTime: maxTimeFilter, sort: sortFilter };
  useEffect(() => {
    if (path !== '/recipes') return;
    const desired = `/recipes${serializeCatalogQuery(catalogFilters)}`;
    if (window.location.pathname + window.location.search !== desired) window.history.replaceState(null, '', desired);
  }, [path, search, category, difficultyFilter, budgetFilter, maxTimeFilter, sortFilter]);
  const detailId = /^\/recipes\/([\da-f-]+)$/i.exec(path)?.[1];
  const editId = /^\/recipes\/([\da-f-]+)\/edit$/i.exec(path)?.[1];
  const editRecipe = editId ? createdRecipes.find(recipe => String(recipe.id) === editId) : undefined;
  const accountRoute = ({ '/profile': 'profile', '/my-recipes': 'my-recipes', '/favorites': 'favorites' } as Record<string, AccountRoute>)[path];
  const isHome = path === '/';
  const activeNav = path === '/' ? 'home'
    : path === '/favorites' ? 'favorites'
    : path === '/recipes/new' || editId ? 'create'
    : path === '/recipes' || detailId ? 'recipes'
    : null;
  const isCatalog = path === '/recipes';
  const isCreate = path === '/recipes/new';
  const authPage = (Object.entries(AUTH_ROUTES).find(([, value]) => value === path)?.[0] ?? null) as keyof typeof AUTH_ROUTES | null;
  const addCreatedRecipe = (recipe: Recipe, ingredients: Ingredient[], prep: number, cook: number, metadata: { rest: number; budget: string; utensils: string[]; servings: number }) => {
    ingredientQuantities[recipe.id] = ingredients;
    recipePreparation[recipe.id] = { prep, cook, ...metadata };
    setCreatedRecipes(current => [recipe, ...current.filter(item => item.id !== recipe.id)]);
    notify('Recette de démonstration enregistrée.');
  };
  const deleteCreatedRecipe = (id: Recipe['id']) => {
    setCreatedRecipes(current => current.filter(recipe => recipe.id !== id));
    setFavorites(current => current.filter(value => value !== id));
    notify('Recette de démonstration supprimée.');
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [catalogPage, setCatalogPage] = useState(1);
  const [catalog, setCatalog] = useState<{ key: string; data?: CatalogPage; error?: boolean }>();
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [detail, setDetail] = useState<{ id: string; recipe?: Recipe; error?: boolean }>();
  const query = new URLSearchParams(serializeCatalogQuery(catalogFilters));
  query.set('limit', isHome && !showAll ? '6' : '24');
  const filterKey = query.toString();
  useEffect(() => { setCatalogPage(1); }, [filterKey]);
  query.set('page', String(catalogPage));
  const catalogKey = query.toString();
  useEffect(() => {
    if (!isHome && !isCatalog) return;
    const controller = new AbortController();
    apiRequest<CatalogPage>(`/recipes?${catalogKey}`, { signal: controller.signal })
      .then(data => setCatalog({ key: catalogKey, data }))
      .catch(() => { if (!controller.signal.aborted) setCatalog({ key: catalogKey, error: true }); });
    return () => controller.abort();
  }, [catalogKey, isHome, isCatalog]);
  const localRecipe = detailId ? createdRecipes.find(recipe => String(recipe.id) === detailId) : undefined;
  useEffect(() => {
    if (!detailId || localRecipe || !detailId.includes('-')) return;
    const controller = new AbortController();
    apiRequest<ApiRecipe>(`/recipes/${detailId}`, { signal: controller.signal })
      .then(recipe => setDetail({ id: detailId, recipe: fromApiRecipe(recipe) }))
      .catch(error => {
        if (!controller.signal.aborted) setDetail({ id: detailId, error: !(error instanceof ApiError && [400, 404].includes(error.status)) });
      });
    return () => controller.abort();
  }, [detailId, localRecipe]);
  const currentCatalog = catalog?.key === catalogKey ? catalog : undefined;
  const currentDetail = detail?.id === detailId ? detail : undefined;
  const selectedRecipe = localRecipe ?? currentDetail?.recipe;
  const detailLoading = Boolean(detailId?.includes('-') && !localRecipe && !currentDetail);
  const isNotFound = !isHome && !isCatalog && !isCreate && !selectedRecipe && !authPage && !accountRoute && !editRecipe && !detailLoading && !currentDetail?.error;
  const visible = useMemo(() => catalog?.data?.items.map(fromApiRecipe) ?? [], [catalog]);
  const allRecipes = Array.from(new Map([...visible, ...favoriteRecipes, ...createdRecipes].map(recipe => [recipe.id, recipe])).values());
  const total = currentCatalog?.data?.total ?? 0;
  const resetAdvancedFilters = () => { setSearch(''); setCategory('Toutes les recettes'); setDifficultyFilter(''); setBudgetFilter(''); setMaxTimeFilter(null); setSortFilter('relevance'); setOnlyFavorites(false); };
  const hasCatalogFilters = Boolean(search || category !== 'Toutes les recettes' || difficultyFilter || budgetFilter || maxTimeFilter !== null || sortFilter !== 'relevance');

  const toggleFavorite = (id: Recipe['id']) => {
    if (!profile) { navigate('/login'); return; }
    const alreadySaved = favorites.includes(id);
    const recipe = allRecipes.find(item => item.id === id) ?? selectedRecipe;
    if (recipe && !alreadySaved) setFavoriteRecipes(current => [...current.filter(item => item.id !== id), recipe]);
    if (alreadySaved) setFavoriteRecipes(current => current.filter(item => item.id !== id));
    setFavorites(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    notify(alreadySaved ? 'Recette retirée des favoris.' : 'Recette ajoutée aux favoris.');
  };
  const chooseCategory = (value: string) => { setCategory(value); setOnlyFavorites(false); setShowAll(true); setMenuOpen(false); navigate('/recipes'); };
  const openFavorites = () => { setMenuOpen(false); if (!profile) { navigate('/login'); return; } setOnlyFavorites(false); setCategory('Toutes les recettes'); setShowAll(true); navigate('/favorites'); };
  const reset = () => { resetAdvancedFilters(); setOnlyFavorites(false); setShowAll(false); setMenuOpen(false); navigate('/'); };
  const browse = () => { resetAdvancedFilters(); setOnlyFavorites(false); setShowAll(true); setMenuOpen(false); navigate('/recipes'); };
  const logout = async () => {
    try {
      if (accessToken) await apiRequest('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        notify('Impossible de fermer la session. Réessaie.', 'error');
        return;
      }
    }
    saveSession(null);
    setAccessToken(null);
    setProfile(null);
    setFavorites([]);
    setFavoriteRecipes([]);
    setOnlyFavorites(false);
    navigate('/');
  };
  const openRecipe = (recipe: Recipe) => navigate(recipePath(recipe.id));

  return <>
    <div className="top-announcement"><span>Les bonnes recettes se partagent, tout simplement</span></div>
    <header className="site-header">
      <div className="header-inner">
        <button className="logo" onClick={reset} aria-label="Accueil Les Petits Plats"><span className="logo-mark"><Icon name="chef" size={25}/></span><span>Les petits<span className="logo-accent">plats.</span></span></button>
        <nav className="desktop-navigation" aria-label="Navigation principale">
          <button className={activeNav === 'home' ? 'nav-active' : ''} aria-current={activeNav === 'home' ? 'page' : undefined} onClick={reset}>Accueil</button><button className={activeNav === 'recipes' ? 'nav-active' : ''} aria-current={activeNav === 'recipes' ? 'page' : undefined} onClick={browse}>Recettes</button><button className={activeNav === 'favorites' ? 'nav-active' : ''} aria-current={activeNav === 'favorites' ? 'page' : undefined} onClick={openFavorites}>Mes favoris</button><button className={activeNav === 'create' ? 'nav-active' : ''} aria-current={activeNav === 'create' ? 'page' : undefined} onClick={() => { setMenuOpen(false); navigate("/recipes/new"); }}>Créer une recette</button>
        </nav>
        <div className="header-actions"><ThemeToggle value={themePreference} onChange={updateThemePreference}/><button className="header-favorites" onClick={openFavorites} aria-label="Afficher mes favoris"><Icon name="heart" size={21}/>{favorites.length > 0 && <span className="fav-counter">{favorites.length}</span>}</button>{profile ? <div className="profile-menu-wrap" ref={profileMenuRef}>
          <button className="profile-trigger" aria-expanded={profileOpen} aria-haspopup="true" onClick={() => setProfileOpen(current => !current)}>
            <span className="profile-avatar">{profile.avatar ? <img src={profile.avatar} alt="Photo de profil" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/> : (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase()}</span><span>{profile.firstName}</span>
          </button>
          {profileOpen && <div className="profile-dropdown">
            <div className="profile-dropdown-head"><strong>{profile.firstName} {profile.lastName}</strong><span>{profile.email}</span></div>
            <button onClick={() => { setProfileOpen(false); navigate('/profile'); }}>Mon profil</button>
            <button onClick={() => { setProfileOpen(false); navigate('/my-recipes'); }}>Mes recettes</button>
            <button onClick={() => { setProfileOpen(false); openFavorites(); }}>Mes favoris</button>
            <button onClick={() => { setProfileOpen(false); navigate('/recipes/new'); }}>Créer une recette</button>
            <button className="profile-logout" onClick={logout}>Se déconnecter</button>
          </div>}
        </div> : <button className="signin-button" onClick={() => navigate('/login')}><Icon name="user" size={17}/>Connexion</button>}<button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Ouvrir le menu"><Icon name={menuOpen ? 'close' : 'menu'} /></button></div>
      </div>
      {menuOpen && <nav className="mobile-navigation" aria-label="Navigation mobile"><button className={activeNav === 'home' ? 'nav-active' : ''} aria-current={activeNav === 'home' ? 'page' : undefined} onClick={reset}>Accueil</button><button className={activeNav === 'recipes' ? 'nav-active' : ''} aria-current={activeNav === 'recipes' ? 'page' : undefined} onClick={browse}>Recettes</button><button className={activeNav === 'favorites' ? 'nav-active' : ''} aria-current={activeNav === 'favorites' ? 'page' : undefined} onClick={openFavorites}>Mes favoris</button><button className={activeNav === 'create' ? 'nav-active' : ''} aria-current={activeNav === 'create' ? 'page' : undefined} onClick={() => { setMenuOpen(false); navigate("/recipes/new"); }}>Créer une recette</button></nav>}
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
      {(isHome || isCatalog) && <section id="recipes" className={isCatalog ? "recipes-section section-container catalog-recipes" : "recipes-section section-container"} aria-labelledby="recipes-title"><div className="section-heading recipes-heading"><div><span className="section-kicker">{onlyFavorites ? 'Ma sélection' : 'Des idées pour se régaler'}</span><h2 id="recipes-title">{onlyFavorites ? 'Mes recettes favorites' : search ? 'Résultats de recherche' : category === 'Toutes les recettes' ? 'Nos recettes à découvrir' : category}</h2></div><span className="recipe-count">{total} recette{total > 1 ? 's' : ''}</span></div>
        <div className="filter-bar"><div className="filter-chips" role="group" aria-label="Filtrer les recettes"><button className={category === 'Toutes les recettes' && !onlyFavorites ? 'active' : ''} onClick={() => { setOnlyFavorites(false); setCategory('Toutes les recettes'); }}>Tout voir</button>{categories.slice(1).map(item => <button key={item} className={!onlyFavorites && category === item ? 'active' : ''} onClick={() => { setCategory(item); setOnlyFavorites(false); }}>{item}</button>)}<button className={onlyFavorites ? 'active' : ''} onClick={openFavorites}><Icon name="heart" size={14}/>Favoris</button></div><span className="filter-caption"><Icon name="sliders" size={17}/> Trouve ton bonheur</span></div>
        {isCatalog && <div className="advanced-search-panel" role="group" aria-label="Filtres avancés">
          <label>Difficulté<select value={difficultyFilter} onChange={event => setDifficultyFilter(event.target.value as CatalogFilters['difficulty'])}><option value="">Toutes</option><option value="Facile">Facile</option><option value="Moyen">Moyen</option></select></label>
          <label>Durée totale<select value={maxTimeFilter ?? ''} onChange={event => setMaxTimeFilter(event.target.value ? Number(event.target.value) : null)}><option value="">Toutes</option><option value="15">15 min max</option><option value="30">30 min max</option><option value="45">45 min max</option><option value="60">1 h max</option><option value="90">1 h 30 max</option><option value="120">2 h max</option></select></label>
          <label>Budget<select value={budgetFilter} onChange={event => setBudgetFilter(event.target.value as CatalogFilters['budget'])}><option value="">Tous</option><option value="Bon marché">Bon marché</option><option value="Moyen">Moyen</option><option value="Assez cher">Assez cher</option></select></label>
          <label>Trier par<select value={sortFilter} onChange={event => setSortFilter(event.target.value as CatalogSort)}><option value="relevance">Par défaut</option><option value="popular">Plus populaires</option><option value="rating">Mieux notées</option><option value="prep">Préparation rapide</option><option value="time">Durée totale</option></select></label>
          {hasCatalogFilters && <button type="button" className="advanced-reset" onClick={resetAdvancedFilters}>Effacer les filtres</button>}
        </div>}
        {!currentCatalog ? <p role="status">Chargement des recettes…</p> : currentCatalog.error ? <p role="alert">Impossible de charger les recettes.</p> : visible.length ? <div className="recipe-grid">{visible.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} saved={favorites.includes(recipe.id)} onToggle={toggleFavorite} onOpen={openRecipe}/>)}</div> : <div className="empty-state"><Icon name="search" size={30}/><h3>Aucune recette trouvée</h3><p>Essaie une autre recherche ou modifie tes filtres.</p><button onClick={resetAdvancedFilters}>Voir toutes les recettes</button></div>}
        {isHome && total > visible.length && <div className="see-more"><button onClick={() => navigate('/recipes')}>Découvrir toutes les recettes <Icon name="arrow" size={17}/></button></div>}
        {isCatalog && currentCatalog?.data && (catalogPage > 1 || total > catalogPage * currentCatalog.data.limit) && <div className="see-more">
          <button disabled={catalogPage === 1} onClick={() => setCatalogPage(page => page - 1)}>Précédent</button>
          <button disabled={total <= catalogPage * currentCatalog.data.limit} onClick={() => setCatalogPage(page => page + 1)}>Suivant</button>
        </div>}
      </section>}
      {isHome && <section className="newsletter-section"><div className="newsletter-inner"><div className="newsletter-deco" aria-hidden="true"><Icon name="chef" size={72}/></div><div><span className="section-kicker">Cuisiner, c'est partager</span><h2>Les meilleures histoires commencent autour d'une table.</h2><p>Garde tes recettes préférées sous la main et fais le plein d'idées gourmandes.</p></div><button onClick={() => navigate("/recipes/new")}><Icon name="plus" size={19}/> Ajouter une recette</button></div></section>}
    </main>}
    {selectedRecipe && <RecipeDetail key={selectedRecipe.id} recipe={selectedRecipe} navigate={navigate} favorite={favorites.includes(selectedRecipe.id)} toggleFavorite={toggleFavorite}/>}
    {isCreate && <RecipeCreate developerMode={developerMode} navigate={navigate} onCreate={addCreatedRecipe}/>}
    {editRecipe && <RecipeCreate key={editRecipe.id} developerMode={developerMode} initialRecipe={editRecipe} navigate={navigate} onCreate={addCreatedRecipe}/>}
    {authPage && <AuthPage key={authPage} page={authPage} navigate={navigate} onLogin={({ profile: user, accessToken: token }, remember) => {
      saveSession(token, remember);
      setSessionError(false);
      setProfile(user);
      setAccessToken(token);
      navigate('/');
    }}/>}
    {accountRoute && sessionPending && <p role="status">Vérification de la connexion…</p>}
    {accountRoute && sessionError && <p role="alert">Impossible de vérifier la connexion. Recharge la page.</p>}
    {accountRoute && profile && <AccountPage key={accountRoute + (profile?.email ?? 'guest')} page={accountRoute} profile={profile} recipes={allRecipes} myRecipes={createdRecipes} favorites={favorites} navigate={navigate} onProfileChange={setProfile} onFavoriteToggle={toggleFavorite} onDeleteRecipe={deleteCreatedRecipe} developerMode={developerMode} onDeveloperModeChange={toggleDeveloperMode}/>}
    {detailLoading && <p className="section-container" role="status">Chargement de la recette…</p>}
    {currentDetail?.error && <p className="section-container" role="alert">Impossible de charger la recette.</p>}
    {isNotFound && <NotFoundPage navigate={navigate}/>}
    <ToastRegion toast={toast} onDismiss={() => setToast(null)}/>
    <footer className="site-footer"><div><span className="footer-brand">Les petits<span>plats.</span></span><p>De bonnes idées, de bons petits plats.</p></div><span>Fait maison, avec amour.</span></footer>

  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
