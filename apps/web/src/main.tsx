import { planningRequest } from './planning-api';
import { PantrySearch } from './PantrySearch';
import { WeeklyMenu } from './WeeklyMenu';
import type { PlannedMeal } from './weekly-menu';
import { ShoppingList } from './ShoppingList';
import { RECIPE_DIFFICULTIES } from './recipe-json';
import { SelectField } from './SelectField';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatTime, recipePath, type Recipe } from './recipe-data';
import { RecipeDetail, RecipeCreate, type RecipeSubmission } from './RecipePages';
import { parseCatalogQuery, serializeCatalogQuery, type CatalogFilters, type CatalogSort } from './recipe-search';
import { AuthPage, AUTH_ROUTES } from './AuthPages';
import { AccountPage, type Profile, type Preferences, type AccountRoute } from './AccountPages';
import { NotFoundPage, ToastRegion, type ToastMessage } from './UiFeedback';
import { apiRequest, ApiError, authHeaders, fromApiRecipe, type ApiRecipe, type CatalogPage } from './api';
import { useAuthenticatedImage } from './useAuthenticatedImage';
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

function RecipeCard({ recipe, saved, onToggle, navigate }: { recipe: Recipe; saved: boolean; onToggle: (id: Recipe['id']) => void; navigate: (path: string) => void }) {
  const [imageReady, setImageReady] = useState(false);
  return <article className="recipe-card">
    <div className={`recipe-image-button ${imageReady || !recipe.image ? "image-ready" : ""}`}>
      {recipe.image && <img src={recipe.image} alt="" loading="lazy" onLoad={() => setImageReady(true)} onError={() => setImageReady(true)}/>}
      {recipe.badge && <span className="recipe-badge">{recipe.badge}</span>}
    </div>
    <button className={`favorite ${saved ? 'active' : ''}`} onClick={() => onToggle(recipe.id)} aria-label={saved ? `Retirer ${recipe.title} des favoris` : `Ajouter ${recipe.title} aux favoris`} aria-pressed={saved}><Icon name="heart" size={20}/></button>
    <div className="card-content">
      <span className="card-category">{recipe.category}</span>
      <a className="card-title-button recipe-card-link" href={recipePath(recipe.id)} onClick={event => {
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
          event.preventDefault();
          navigate(recipePath(recipe.id));
        }
      }}><h3>{recipe.title}</h3></a>
      <div className="card-meta"><span className="rating"><Icon name="star" size={15}/>{recipe.rating.toFixed(1)} <span className="reviews">({recipe.reviews})</span></span><span><Icon name="clock" size={15}/>{formatTime(recipe.time)}</span></div>
    </div>
  </article>;
}

type PreferenceUpdate = { theme?: ThemePreference; developerMode?: boolean };

function patchPreferences(token: string, fields: PreferenceUpdate & { initialize?: boolean }, signal: AbortSignal) {
  return apiRequest<Preferences>('/me/preferences', {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
    signal,
  });
}

function legacyPreferences(profile: Profile): PreferenceUpdate {
  const fields: PreferenceUpdate = {};
  try {
    const mode = window.localStorage.getItem('petitsplats.developerMode');
    const theme = window.localStorage.getItem('petitsplats.theme');
    if (profile.developerMode === null && (mode === 'true' || mode === 'false')) fields.developerMode = mode === 'true';
    if (profile.theme === null && (theme === 'light' || theme === 'dark' || theme === 'system')) fields.theme = theme;
  } catch { /* Storage can be blocked. */ }
  return fields;
}

function App() {
  const [search, setSearch] = useState(() => parseCatalogQuery(window.location.search).query);
  const [category, setCategory] = useState(() => parseCatalogQuery(window.location.search).category);
  const [difficultyFilter, setDifficultyFilter] = useState<CatalogFilters['difficulty']>(() => parseCatalogQuery(window.location.search).difficulty);
  const [budgetFilter, setBudgetFilter] = useState<CatalogFilters['budget']>(() => parseCatalogQuery(window.location.search).budget);
  const [maxTimeFilter, setMaxTimeFilter] = useState<number | null>(() => parseCatalogQuery(window.location.search).maxTime);
  const [sortFilter, setSortFilter] = useState<CatalogSort>(() => parseCatalogQuery(window.location.search).sort);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [ownedRecipesPending, setOwnedRecipesPending] = useState(false);
  const [ownedRecipesError, setOwnedRecipesError] = useState(false);
  const [recipeRevision, setRecipeRevision] = useState(0);
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
  const avatar = useAuthenticatedImage(profile?.avatar, Boolean(profile?.avatar?.startsWith('/me/avatar/')), accessToken);
  const [sessionPending, setSessionPending] = useState(Boolean(accessToken));
  const [sessionError, setSessionError] = useState(false);
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const preferenceRequest = useRef<AbortController | null>(null);
  const preferencesPending = sessionPending || preferenceSaving;
  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    apiRequest<Profile>('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal })
      .then(async user => {
        const legacy = legacyPreferences(user);
        if (Object.keys(legacy).length) {
          try {
            user = { ...user, ...await patchPreferences(accessToken, { ...legacy, initialize: true }, controller.signal) };
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) throw error;
            // The saved profile remains usable if the optional import fails.
          }
        }
        if (!controller.signal.aborted) {
          setProfile(user);
          setSessionError(false);
        }
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          saveSession(null);
          setProfile(null);
          setAccessToken(null);
        } else { setSessionError(true); }
      })
      .finally(() => { if (!controller.signal.aborted) setSessionPending(false); });
    return () => {
      controller.abort();
      preferenceRequest.current?.abort();
      preferenceRequest.current = null;
      setPreferenceSaving(false);
    };
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
  const [guestTheme, setGuestTheme] = useState<ThemePreference>(() => {
    try { const stored = window.localStorage.getItem('petitsplats.theme'); return stored === 'light' || stored === 'dark' ? stored : 'system'; }
    catch { return 'system'; }
  });
  const themePreference = profile ? profile.theme ?? 'system' : guestTheme;
  const developerMode = profile?.developerMode ?? false;
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = themePreference === 'dark' || (themePreference === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      const favicon = document.getElementById('app-favicon');
      const iconPath = dark ? '/favicon-dark.svg' : '/favicon.svg';
      if (favicon && favicon.getAttribute('href') !== iconPath) favicon.setAttribute('href', iconPath);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191817' : '#fffdf9');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [themePreference]);
  async function savePreferences(fields: PreferenceUpdate) {
    if (!accessToken || sessionPending || preferenceRequest.current) return;
    const controller = new AbortController();
    preferenceRequest.current = controller;
    setPreferenceSaving(true);
    try {
      const saved = await patchPreferences(accessToken, fields, controller.signal);
      if (!controller.signal.aborted) setProfile(current => current ? { ...current, ...saved } : current);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) invalidateSession();
      notify('Impossible d’enregistrer les préférences.', 'error');
    } finally {
      if (preferenceRequest.current === controller) {
        preferenceRequest.current = null;
        setPreferenceSaving(false);
      }
    }
  }

  const updateThemePreference = (value: ThemePreference) => {
    if (profile) {
      void savePreferences({ theme: value });
      return;
    }
    setGuestTheme(value);
    try { window.localStorage.setItem('petitsplats.theme', value); } catch { /* Storage can be blocked. */ }
  };
  const toggleDeveloperMode = (enabled: boolean) => void savePreferences({ developerMode: enabled });
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileMenuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      setMenuOpen(false);
      mobileMenuButton.current?.focus();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);
  const [path, setPath] = useState(window.location.pathname);
  const navigate = (next: string) => {
    setProfileOpen(false);
    setMenuOpen(false);
    if (window.location.pathname !== next) window.history.pushState(null, '', next);
    setPath(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  useEffect(() => {
    if (!sessionPending && !sessionError && !profile && (['/favorites', '/profile', '/my-recipes', '/recipes/new', '/shopping-list', '/weekly-menu'].includes(path) || path.endsWith('/edit'))) navigate('/login');
  }, [path, profile, sessionPending, sessionError]);
  useEffect(() => {
    const onPop = () => {
      setProfileOpen(false);
      setMenuOpen(false);
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
  const needsOwnedRecipes = Boolean(editId || path === '/my-recipes');
  const [ownedRecipesLoaded, setOwnedRecipesLoaded] = useState<string | null>(null);
  useEffect(() => {
    if (!accessToken || !needsOwnedRecipes) return;
    const controller = new AbortController();
    setOwnedRecipesPending(true);
    setOwnedRecipesError(false);
    apiRequest<ApiRecipe[]>('/me/recipes', { headers: authHeaders(accessToken), signal: controller.signal })
      .then(items => { setCreatedRecipes(items.map(fromApiRecipe)); setOwnedRecipesLoaded(accessToken); })
      .catch(error => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) invalidateSession();
        else setOwnedRecipesError(true);
      })
      .finally(() => { if (!controller.signal.aborted) setOwnedRecipesPending(false); });
    return () => controller.abort();
  }, [needsOwnedRecipes, accessToken, recipeRevision]);
  const accountRoute = ({ '/profile': 'profile', '/my-recipes': 'my-recipes', '/favorites': 'favorites' } as Record<string, AccountRoute>)[path];
  const isShoppingList = path === '/shopping-list';
  const isWeeklyMenu = path === '/weekly-menu';
  function planningSession() {
    if (sessionPending || sessionError) {
      notify('Impossible de vérifier la connexion pour le moment.', 'error');
      return null;
    }
    if (!profile || !accessToken) { navigate('/login'); return null; }
    return accessToken;
  }

  async function saveShopping(meals: { recipeId: Recipe['id']; servings: number }[], success?: string) {
    const token = planningSession();
    if (!token) return false;
    try {
      await planningRequest('/me/shopping-list', token, { method: 'POST', body: JSON.stringify({ meals }) });
      if (success) notify(success);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) invalidateSession();
      notify('Impossible d’ajouter les ingrédients à la liste de courses.', 'error');
      return false;
    }
  }

  async function planMeal(recipe: Recipe, servings: number, date: string) {
    const token = planningSession();
    if (!token) return false;
    try {
      await planningRequest('/me/weekly-menu', token, {
        method: 'POST', body: JSON.stringify({ recipeId: recipe.id, servings, date }),
      });
      notify('Repas ajouté au menu de la semaine.');
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) invalidateSession();
      notify('Impossible d’enregistrer le repas.', 'error');
      return false;
    }
  }

  async function addWeeklyMenuToShopping(meals: PlannedMeal[]) {
    await saveShopping(meals.map(({ recipeId, servings }) => ({ recipeId, servings })), 'Menu ajouté à la liste de courses.');
  }
  const isHome = path === '/';
  const activeNav = path === '/' ? 'home'
    : path === '/favorites' ? 'favorites'
    : path === '/recipes/new' || editId ? 'create'
    : path === '/recipes' || detailId || path === '/pantry-search' ? 'recipes'
    : null;
  const isCatalog = path === '/recipes';
  const isPantrySearch = path === '/pantry-search';
  const isCreate = path === '/recipes/new';
  const authPage = (Object.entries(AUTH_ROUTES).find(([, value]) => value === path)?.[0] ?? null) as keyof typeof AUTH_ROUTES | null;
  function invalidateSession() {
    saveSession(null);
    setAccessToken(null);
    setProfile(null);
    setCreatedRecipes([]);
    setDetail(undefined);
    setFavoriteRecipes([]);
  }

  const addCreatedRecipe = async (submission: RecipeSubmission, id?: Recipe['id']) => {
    try {
      const response = await apiRequest<ApiRecipe>(id ? `/recipes/${id}` : '/recipes', {
        method: id ? 'PUT' : 'POST',
        headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      const recipe = fromApiRecipe(response);
      setCreatedRecipes(current => [recipe, ...current.filter(item => item.id !== recipe.id)]);
      setRecipeRevision(revision => revision + 1);
      notify('Recette enregistrée.');
      return recipe;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) invalidateSession();
      throw new Error('Impossible d’enregistrer la recette.');
    }
  };
  const deleteCreatedRecipe = async (id: Recipe['id']) => {
    try {
      await apiRequest(`/recipes/${id}`, { method: 'DELETE', headers: authHeaders(accessToken) });
      setCreatedRecipes(current => current.filter(recipe => recipe.id !== id));
      setFavoriteRecipes(current => current.filter(recipe => recipe.id !== id));
      setRecipeRevision(revision => revision + 1);
      notify('Recette supprimée.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) invalidateSession();
      notify('Impossible de supprimer la recette.', 'error');
    }
  };
  const [showAll, setShowAll] = useState(false);

  const [catalogPage, setCatalogPage] = useState(1);
  const [catalog, setCatalog] = useState<{ key: string; data?: CatalogPage; error?: boolean }>();
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const signedIn = Boolean(profile);
  const [favoritesPending, setFavoritesPending] = useState(Boolean(accessToken));
  const [favoritesError, setFavoritesError] = useState(false);
  const favoriteUpdate = useRef(false);
  useEffect(() => {
    if (!accessToken || !signedIn) return;
    const controller = new AbortController();
    setFavoritesPending(true);
    setFavoritesError(false);
    apiRequest<ApiRecipe[]>('/me/favorites', { headers: authHeaders(accessToken), signal: controller.signal })
      .then(items => setFavoriteRecipes(items.map(fromApiRecipe)))
      .catch(error => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) invalidateSession();
        else setFavoritesError(true);
      })
      .finally(() => { if (!controller.signal.aborted) setFavoritesPending(false); });
    return () => controller.abort();
  }, [accessToken, signedIn, recipeRevision]);
  const favorites = favoriteRecipes.map(recipe => recipe.id);
  const [detail, setDetail] = useState<{ id: string; revision: number; recipe?: Recipe; error?: boolean }>();
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
  }, [catalogKey, isHome, isCatalog, recipeRevision]);
  const localRecipe = detailId && profile ? createdRecipes.find(recipe => String(recipe.id) === detailId) : undefined;
  useEffect(() => {
    if (!detailId || !detailId.includes('-')) return;
    const controller = new AbortController();
    apiRequest<ApiRecipe>(`/recipes/${detailId}`, { headers: authHeaders(accessToken), signal: controller.signal })
      .then(recipe => {
        if (!controller.signal.aborted) setDetail({ id: detailId, revision: recipeRevision, recipe: fromApiRecipe(recipe) });
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          if (error instanceof ApiError && error.status === 401) invalidateSession();
          setDetail({ id: detailId, revision: recipeRevision, error: !(error instanceof ApiError && [400, 401, 404].includes(error.status)) });
        }
      });
    return () => controller.abort();
  }, [detailId, accessToken, recipeRevision]);
  const currentCatalog = catalog?.key === catalogKey ? catalog : undefined;
  const currentDetail = detail?.id === detailId && detail?.revision === recipeRevision ? detail : undefined;
  const selectedRecipe = currentDetail?.recipe ?? localRecipe;
  const detailLoading = Boolean(detailId?.includes('-') && !localRecipe && !currentDetail);
  const editorialLoading = needsOwnedRecipes && (!!accessToken && (ownedRecipesPending || (ownedRecipesLoaded !== accessToken && !ownedRecipesError)));
  const isNotFound = !isHome && !isCatalog && !isCreate && !isShoppingList && !isWeeklyMenu && !isPantrySearch && !selectedRecipe && !authPage && !accountRoute && !editRecipe && !detailLoading && !currentDetail?.error && !(editId && (editorialLoading || ownedRecipesError || !profile));
  const visible = useMemo(() => catalog?.data?.items.map(fromApiRecipe) ?? [], [catalog]);

  const total = currentCatalog?.data?.total ?? 0;
  const resetAdvancedFilters = () => { setSearch(''); setCategory('Toutes les recettes'); setDifficultyFilter(''); setBudgetFilter(''); setMaxTimeFilter(null); setSortFilter('relevance'); setOnlyFavorites(false); };
  const hasCatalogFilters = Boolean(search || category !== 'Toutes les recettes' || difficultyFilter || budgetFilter || maxTimeFilter !== null || sortFilter !== 'relevance');

  const toggleFavorite = async (id: Recipe['id']) => {
    if (!profile) { navigate('/login'); return; }
    if (favoritesPending || favoriteUpdate.current) return;
    const alreadySaved = favorites.includes(id);
    favoriteUpdate.current = true;
    try {
      await apiRequest(`/me/favorites/${id}`, { method: alreadySaved ? 'DELETE' : 'PUT', headers: authHeaders(accessToken) });
      const latest = await apiRequest<ApiRecipe[]>('/me/favorites', { headers: authHeaders(accessToken) });
      setFavoriteRecipes(latest.map(fromApiRecipe));
      setFavoritesError(false);
      notify(alreadySaved ? 'Recette retirée des favoris.' : 'Recette ajoutée aux favoris.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) invalidateSession();
      notify('Impossible de mettre à jour les favoris.', 'error');
    } finally { favoriteUpdate.current = false; }
  };

  const saveProfile = async ({ firstName, lastName, bio, avatar, newsletter, publicRecipes }: Profile) => {
    const photo = avatar === null || avatar?.startsWith('data:') ? avatar : undefined;
    try {
      const updated = await apiRequest<Profile>('/me/profile', {
        method: 'PUT', headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, bio, photo, newsletter, publicRecipes }),
      });
      setProfile(current => current ? { ...updated, theme: current.theme, developerMode: current.developerMode } : current);
      return updated;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) invalidateSession();
      throw error;
    }
  };
  const chooseCategory = (value: string) => { setCategory(value); setOnlyFavorites(false); setShowAll(true); navigate('/recipes'); };
  const openFavorites = () => { if (!profile) { navigate('/login'); return; } setOnlyFavorites(false); setCategory('Toutes les recettes'); setShowAll(true); navigate('/favorites'); };
  const reset = () => { resetAdvancedFilters(); setOnlyFavorites(false); setShowAll(false); navigate('/'); };
  const browse = () => { resetAdvancedFilters(); setOnlyFavorites(false); setShowAll(true); navigate('/recipes'); };
  const logout = async () => {
    try {
      if (accessToken) await apiRequest('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        notify('Impossible de fermer la session. Veuillez réessayer.', 'error');
        return;
      }
    }
    saveSession(null);
    setAccessToken(null);
    setProfile(null);
    setCreatedRecipes([]);
    setDetail(undefined);
    setFavoriteRecipes([]);
    setOnlyFavorites(false);
    navigate('/');
  };

  return <>
    <div className="top-announcement"><span>Les bonnes recettes se partagent, tout simplement</span></div>
    <header className="site-header">
      <div className="header-inner">
        <button className="logo" onClick={reset} aria-label="Accueil Les Petits Plats"><span className="logo-mark"><Icon name="chef" size={25}/></span><span className="logo-wordmark">Les petits<span className="logo-accent">plats.</span></span></button>
        <nav className="desktop-navigation" aria-label="Navigation principale">
          <button className={activeNav === 'home' ? 'nav-active' : ''} aria-current={activeNav === 'home' ? 'page' : undefined} onClick={reset}>Accueil</button><button className={activeNav === 'recipes' ? 'nav-active' : ''} aria-current={activeNav === 'recipes' ? 'page' : undefined} onClick={browse}>Recettes</button><button className={activeNav === 'favorites' ? 'nav-active' : ''} aria-current={activeNav === 'favorites' ? 'page' : undefined} onClick={openFavorites}>Mes favoris</button><button className={activeNav === 'create' ? 'nav-active' : ''} aria-current={activeNav === 'create' ? 'page' : undefined} onClick={() => navigate("/recipes/new")}>Créer une recette</button>
        </nav>
        <div className="header-actions"><ThemeToggle value={themePreference} onChange={updateThemePreference} disabled={preferencesPending}/><button className="header-favorites" onClick={openFavorites} aria-label="Afficher mes favoris"><Icon name="heart" size={21}/>{favorites.length > 0 && <span className="fav-counter">{favorites.length}</span>}</button>{profile ? <div className="profile-menu-wrap" ref={profileMenuRef}>
          <button className="profile-trigger" aria-label="Menu du profil" aria-expanded={profileOpen} aria-haspopup="true" onClick={() => setProfileOpen(current => !current)}>
            <span className="profile-avatar">{avatar ? <img src={avatar} alt="Photo de profil" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/> : (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase()}</span><span>{profile.firstName}</span>
          </button>
          {profileOpen && <div className="profile-dropdown">
            <div className="profile-dropdown-head"><strong>{profile.firstName} {profile.lastName}</strong><span>{profile.email}</span></div>
            <button onClick={() => { setProfileOpen(false); navigate('/profile'); }}>Mon profil</button>
            <button onClick={() => { setProfileOpen(false); navigate('/my-recipes'); }}>Mes recettes</button>
            <button onClick={() => { setProfileOpen(false); openFavorites(); }}>Mes favoris</button>
            <button onClick={() => { setProfileOpen(false); navigate('/recipes/new'); }}>Créer une recette</button>
            <button onClick={() => { setProfileOpen(false); navigate('/shopping-list'); }}>Ma liste de courses</button>
            <button onClick={() => navigate('/weekly-menu')}>Menu de la semaine</button>
            <button className="profile-logout" onClick={logout}>Se déconnecter</button>
          </div>}
        </div> : <button className="signin-button" onClick={() => navigate('/login')}><Icon name="user" size={17}/>Connexion</button>}
          <button type="button" ref={mobileMenuButton} className="mobile-menu" onClick={() => setMenuOpen(open => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}><Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      <div className="mobile-navigation-panel" data-open={menuOpen} inert={!menuOpen}>
        <div className="mobile-navigation-content">
          <nav id="mobile-navigation" className="mobile-navigation" aria-label="Navigation mobile">
            <button className={activeNav === 'home' ? 'nav-active' : ''} aria-current={activeNav === 'home' ? 'page' : undefined} onClick={reset}>Accueil</button>
            <button className={activeNav === 'recipes' ? 'nav-active' : ''} aria-current={activeNav === 'recipes' ? 'page' : undefined} onClick={browse}>Recettes</button>
            <button className={activeNav === 'favorites' ? 'nav-active' : ''} aria-current={activeNav === 'favorites' ? 'page' : undefined} onClick={openFavorites}>Mes favoris</button>
            <button className={activeNav === 'create' ? 'nav-active' : ''} aria-current={activeNav === 'create' ? 'page' : undefined} onClick={() => navigate("/recipes/new")}>Créer une recette</button>
          </nav>
        </div>
      </div>
    </header>
    {(isHome || isCatalog) && <main>
      {isHome && <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/> La cuisine qui rassemble</span><h1>Le carnet de<br/> <em>recettes maison</em></h1><p>Recherchez une recette par nom ou par ingrédient, ou parcourez le catalogue par catégorie.</p>
            <form className="hero-search" onSubmit={event => { event.preventDefault(); navigate('/recipes'); }}><Icon name="search" size={23}/><label className="sr-only" htmlFor="recipe-search">Rechercher une recette ou un ingrédient</label><input id="recipe-search" value={search} onChange={event => { setSearch(event.target.value); setShowAll(true); }} placeholder="Nom de recette ou ingrédient" /><button type="submit">Rechercher <Icon name="arrow" size={17}/></button></form>
            <div className="popular-searches"><strong>Suggestions</strong><button onClick={() => { setSearch('chocolat'); setShowAll(true); navigate('/recipes'); }}>Chocolat</button><button onClick={() => { setSearch('poulet'); setShowAll(true); navigate('/recipes'); }}>Poulet</button><button onClick={() => { setSearch('pâtes'); setShowAll(true); navigate('/recipes'); }}>Pâtes</button></div>
          </div>
          <div className="hero-visual"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?w=1300&q=90" alt="Plat gourmand à partager" /><div className="hero-stamp"><span>Fait avec</span><Icon name="heart" size={28}/><span>à la maison</span></div></div>
        </div>
      </section>
      <section className="categories-section section-container" aria-labelledby="categories-title"><div className="section-heading"><div><span className="section-kicker">Catalogue</span><h2 id="categories-title">Explorer par catégorie</h2></div><p>Entrées, plats, desserts et petits-déjeuners.</p></div><div className="category-grid">{categories.slice(1).map(item => <button key={item} className={`category-tile ${category === item && !onlyFavorites ? 'selected' : ''}`} onClick={() => chooseCategory(item)}><span className="category-emoji" aria-hidden="true">{categoryInitials[item]}</span><span>{item}</span><Icon name="arrow" size={17}/></button>)}</div></section></>}
      {isCatalog && <section className="catalog-intro"><span className="section-kicker">Catalogue</span><h1>Toutes les recettes</h1><p>Filtrez les recettes par catégorie, difficulté, durée ou budget.</p><form className="hero-search catalog-search" onSubmit={event => event.preventDefault()}><Icon name="search" size={21}/><label className="sr-only" htmlFor="catalog-search">Rechercher une recette</label><input id="catalog-search" placeholder="Nom de recette ou ingrédient" value={search} onChange={event => setSearch(event.target.value)}/><button type="submit">Rechercher <Icon name="arrow" size={17}/></button></form><a className="detail-outline-button planning-button catalog-pantry-button" href="/pantry-search" onClick={event => {
              if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                event.preventDefault();
                navigate('/pantry-search');
              }
            }}><Icon name="sliders" size={17}/>Rechercher avec mes ingrédients<Icon name="arrow" size={16}/></a></section>}
      {(isHome || isCatalog) && <section id="recipes" className={isCatalog ? "recipes-section section-container catalog-recipes" : "recipes-section section-container"} aria-labelledby="recipes-title"><div className="section-heading recipes-heading"><div><span className="section-kicker">{onlyFavorites ? 'Ma sélection' : 'Catalogue'}</span><h2 id="recipes-title">{onlyFavorites ? 'Mes recettes favorites' : search ? 'Résultats de recherche' : category === 'Toutes les recettes' ? 'Recettes à découvrir' : category}</h2></div><span className="recipe-count">{total} recette{total > 1 ? 's' : ''}</span></div>
        <div className="filter-bar"><div className="filter-chips" role="group" aria-label="Filtrer les recettes"><button className={category === 'Toutes les recettes' && !onlyFavorites ? 'active' : ''} onClick={() => { setOnlyFavorites(false); setCategory('Toutes les recettes'); }}>Tout voir</button>{categories.slice(1).map(item => <button key={item} className={!onlyFavorites && category === item ? 'active' : ''} onClick={() => { setCategory(item); setOnlyFavorites(false); }}>{item}</button>)}<button className={onlyFavorites ? 'active' : ''} onClick={openFavorites}><Icon name="heart" size={14}/>Favoris</button></div><span className="filter-caption"><Icon name="sliders" size={17}/> Catégories de recettes</span></div>
        {isCatalog && <div className="advanced-search-panel" role="group" aria-label="Filtres avancés">
          <SelectField className="catalog-select" label="Difficulté" value={difficultyFilter} onChange={setDifficultyFilter} options={[{ value: '', label: 'Toutes' }, ...RECIPE_DIFFICULTIES.map(value => ({ value, label: value }))]}/>
          <SelectField className="catalog-select" label="Durée totale" value={maxTimeFilter?.toString() ?? ''} onChange={value => setMaxTimeFilter(value ? Number(value) : null)} options={[{ value: "", label: "Toutes" }, { value: "15", label: "15 min max" }, { value: "30", label: "30 min max" }, { value: "45", label: "45 min max" }, { value: "60", label: "1 h max" }, { value: "90", label: "1 h 30 max" }, { value: "120", label: "2 h max" }]}/>
          <SelectField className="catalog-select" label="Budget" value={budgetFilter} onChange={value => setBudgetFilter(value as CatalogFilters['budget'])} options={[{ value: "", label: "Tous" }, { value: "Bon marché", label: "Bon marché" }, { value: "Moyen", label: "Moyen" }, { value: "Assez cher", label: "Assez cher" }]}/>
          <SelectField className="catalog-select" label="Trier par" value={sortFilter} onChange={value => setSortFilter(value as CatalogSort)} options={[{ value: "relevance", label: "Par défaut" }, { value: "popular", label: "Plus populaires" }, { value: "rating", label: "Mieux notées" }, { value: "prep", label: "Préparation rapide" }, { value: "time", label: "Durée totale" }]}/>
          {hasCatalogFilters && <button type="button" className="advanced-reset" onClick={resetAdvancedFilters}>Effacer les filtres</button>}
        </div>}
        {!currentCatalog ? <p role="status">Chargement des recettes…</p> : currentCatalog.error ? <p role="alert">Impossible de charger les recettes.</p> : visible.length ? <div className="recipe-grid">{visible.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} saved={favorites.includes(recipe.id)} onToggle={toggleFavorite} navigate={navigate}/>)}</div> : <div className="empty-state"><Icon name="search" size={30}/><h3>Aucune recette trouvée</h3><p>Essayez une autre recherche ou modifiez les filtres.</p><button onClick={resetAdvancedFilters}>Voir toutes les recettes</button></div>}
        {isHome && total > visible.length && <div className="see-more"><button onClick={() => navigate('/recipes')}>Découvrir toutes les recettes <Icon name="arrow" size={17}/></button></div>}
        {isCatalog && currentCatalog?.data && (catalogPage > 1 || total > catalogPage * currentCatalog.data.limit) && <div className="see-more">
          <button disabled={catalogPage === 1} onClick={() => setCatalogPage(page => page - 1)}>Précédent</button>
          <button disabled={total <= catalogPage * currentCatalog.data.limit} onClick={() => setCatalogPage(page => page + 1)}>Suivant</button>
        </div>}
      </section>}
      {isHome && <section className="newsletter-section"><div className="newsletter-inner"><div className="newsletter-deco" aria-hidden="true"><Icon name="chef" size={72}/></div><div><span className="section-kicker">Carnet de recettes</span><h2>Ajoutez une recette à votre carnet</h2><p>Enregistrez les ingrédients et les étapes de préparation pour retrouver la recette à tout moment.</p></div><button onClick={() => navigate("/recipes/new")}><Icon name="plus" size={19}/> Ajouter une recette</button></div></section>}
    </main>}
    {(isShoppingList || isWeeklyMenu) && sessionPending && <p className="section-container" role="status">Vérification de la connexion…</p>}
    {(isShoppingList || isWeeklyMenu) && sessionError && <p className="section-container" role="alert">Impossible de vérifier la connexion. Rechargez la page.</p>}
    {isShoppingList && profile && accessToken && <ShoppingList key={accessToken} token={accessToken}/>}
    {isWeeklyMenu && profile && accessToken && <WeeklyMenu key={accessToken} token={accessToken} onAddToShopping={addWeeklyMenuToShopping}/>}
    {isPantrySearch && <PantrySearch/>}
    {selectedRecipe && <RecipeDetail showNotes={Boolean(profile)} onPlanMeal={(servings, date) => planMeal(selectedRecipe, servings, date)} addToShopping={servings => saveShopping([{ recipeId: selectedRecipe.id, servings }])} token={accessToken} key={selectedRecipe.id} recipe={selectedRecipe} navigate={navigate} favorite={favorites.includes(selectedRecipe.id)} toggleFavorite={toggleFavorite}/>}
    {isCreate && profile && <RecipeCreate token={accessToken} defaultPublic={profile.publicRecipes} developerMode={developerMode} navigate={navigate} onCreate={addCreatedRecipe}/>}
    {editRecipe && profile && <RecipeCreate token={accessToken} defaultPublic={profile.publicRecipes} key={editRecipe.id} developerMode={developerMode} initialRecipe={editRecipe} navigate={navigate} onCreate={addCreatedRecipe}/>}
    {authPage && <AuthPage key={authPage} page={authPage} navigate={navigate} signedIn={Boolean(profile)} sessionPending={sessionPending} onReset={() => { invalidateSession(); navigate('/login'); notify('Mot de passe réinitialisé.'); }} onLogin={({ profile: user, accessToken: token }, remember) => {
      saveSession(token, remember);
      setSessionError(false);
      setProfile(user);
      setSessionPending(true);
      setAccessToken(token);
      navigate('/');
    }}/>}
    {accountRoute && sessionPending && <p role="status">Vérification de la connexion…</p>}
    {accountRoute && sessionError && <p role="alert">Impossible de vérifier la connexion. Rechargez la page.</p>}
    {accountRoute && profile && <AccountPage key={accountRoute + (profile?.email ?? 'guest')} page={accountRoute} profile={profile} recipes={favoriteRecipes} token={accessToken} favoritesPending={favoritesPending} favoritesError={favoritesError} myRecipes={createdRecipes} favorites={favorites} navigate={navigate} onProfileChange={saveProfile} onFavoriteToggle={toggleFavorite} onDeleteRecipe={deleteCreatedRecipe} developerMode={developerMode} preferencesPending={preferencesPending} onDeveloperModeChange={toggleDeveloperMode}/>}
    {editorialLoading && <p className="section-container" role="status">Chargement de vos recettes…</p>}
    {needsOwnedRecipes && ownedRecipesError && <p className="section-container" role="alert">Impossible de charger vos recettes.</p>}
    {detailLoading && <p className="section-container" role="status">Chargement de la recette…</p>}
    {currentDetail?.error && <p className="section-container" role="alert">Impossible de charger la recette.</p>}
    {isNotFound && <NotFoundPage navigate={navigate}/>}
    <ToastRegion toast={toast} onDismiss={() => setToast(null)}/>
    <footer className={isShoppingList ? "site-footer shopping-footer" : "site-footer"}><div><span className="footer-brand">Les petits<span>plats.</span></span><p>Carnet de recettes maison.</p></div><span>Recettes, ingrédients et préparation</span></footer>

  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
