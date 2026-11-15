import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { formatTime, recipePath, type Recipe } from './recipe-data';
import { ConfirmDialog } from './UiFeedback';
import { useAuthenticatedImage } from './useAuthenticatedImage';
import { validateRecipeImage } from './recipe-draft';
import { ToggleSwitch } from './ToggleSwitch';
import { AccountPassword } from './AccountPassword';
import { ImagePicker } from './ImagePicker';
import './account.css';

export type Profile = { firstName: string; lastName: string; email: string; avatar?: string | null; bio: string; newsletter: boolean; publicRecipes: boolean };
export type AccountRoute = 'profile' | 'my-recipes' | 'favorites';
type Props = {
  page: AccountRoute;
  profile: Profile | null;
  recipes: Recipe[];
  favorites: Recipe['id'][];
  myRecipes: Recipe[];
  navigate: (path: string) => void;
  onProfileChange: (profile: Profile) => Promise<Profile>;
  token: string | null;
  favoritesPending: boolean;
  favoritesError: boolean;
  onFavoriteToggle: (id: Recipe['id']) => void;
  onDeleteRecipe: (id: Recipe['id']) => void;
  developerMode: boolean;
  onDeveloperModeChange: (enabled: boolean) => void;
};

const links: { page: AccountRoute; label: string; href: string }[] = [
  { page: 'profile', label: 'Mon profil', href: '/profile' },
  { page: 'my-recipes', label: 'Mes recettes', href: '/my-recipes' },
  { page: 'favorites', label: 'Mes favoris', href: '/favorites' }
];

function NavLink({ to, navigate, children }: { to: string; navigate: Props['navigate']; children: ReactNode }) {
  return <a href={to} onClick={event => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      event.preventDefault(); navigate(to);
    }
  }}>{children}</a>;
}

function InitialAvatar({ profile, large = false }: { profile: Profile; large?: boolean }) {
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  return <span className={`account-avatar ${large ? 'account-avatar-large' : ''}`}>{profile.avatar ? <img src={profile.avatar} alt="Photo de profil"/> : initials}</span>;
}

function EmptyContent({ kind, navigate }: { kind: 'favorites' | 'my-recipes'; navigate: Props['navigate'] }) {
  return <div className="account-empty">
    <span className="account-empty-illustration" aria-hidden="true">{kind === 'favorites' ? '♡' : '+'}</span>
    <h2>{kind === 'favorites' ? 'Pas encore de recettes favorites' : 'Aucune recette enregistrée'}</h2>
    <p>{kind === 'favorites' ? 'Ajoutez des recettes à vos favoris depuis le catalogue.' : 'Les recettes que vous créez apparaîtront dans cet espace.'}</p>
    <button className="account-primary" onClick={() => navigate(kind === 'favorites' ? '/recipes' : '/recipes/new')}>{kind === 'favorites' ? 'Explorer les recettes' : 'Créer une recette'}</button>
  </div>;
}

function AccountRecipeImage({ recipe, token }: { recipe: Recipe; token: string | null }) {
  const image = useAuthenticatedImage(recipe.image, recipe.privateImage, token);
  return image ? <img src={image} loading="lazy" alt={recipe.title}/> : null;
}

export function AccountPage({ page, profile, recipes, favorites, myRecipes, navigate, onProfileChange, onFavoriteToggle, onDeleteRecipe, developerMode, onDeveloperModeChange, token, favoritesPending, favoritesError }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'name' | 'time'>('recent');
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? '');
  const [newsletter, setNewsletter] = useState(profile?.newsletter ?? false);
  const [publicRecipes, setPublicRecipes] = useState(profile?.publicRecipes ?? true);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const resolvedAvatar = useAuthenticatedImage(avatar, avatar.startsWith('/me/avatar/'), token);
  const sidebarAvatar = useAuthenticatedImage(profile?.avatar, Boolean(profile?.avatar?.startsWith('/me/avatar/')), token);
  const [photoError, setPhotoError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Recipe | null>(null);

  const requireProfile = page !== 'favorites';
  if (!profile && requireProfile) {
    return <main className="account-guest"><span className="section-kicker">Espace personnel</span><h1>Connexion requise</h1><p>Connectez-vous pour accéder à votre espace personnel.</p><button className="account-primary" onClick={() => navigate('/login')}>Se connecter</button></main>;
  }

  const source = page === 'favorites' ? recipes.filter(recipe => favorites.includes(recipe.id)) : myRecipes;
  const filtered = source.filter(recipe => [recipe.title,recipe.category,recipe.description].join(' ').toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr'))).sort((a,b) => sort === 'name' ? a.title.localeCompare(b.title,'fr') : sort === 'time' ? a.time-b.time : 0);

  const onPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = event.target.files?.[0];
    if (!file) return;
    const error = validateRecipeImage(file);
    if (error) { setPhotoError(error); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setAvatar(reader.result); };
    reader.onerror = () => setPhotoError('Impossible de lire cette image.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !profile || !firstName.trim() || !lastName.trim()) return;
    setNotice(''); setSaveError(''); setSaving(true);
    try {
      const updated = await onProfileChange({ ...profile, firstName: firstName.trim(), lastName: lastName.trim(), bio: bio.trim(), avatar: avatar || null, newsletter, publicRecipes });
      setAvatar(updated.avatar ?? '');
      setNotice('Profil enregistré.');
    } catch { setSaveError('Impossible d’enregistrer le profil.'); }
    finally { setSaving(false); }
  };

  return <main className="account-page">
    <div className="account-container">
      <nav className="breadcrumbs" aria-label="Fil d’Ariane"><NavLink to="/" navigate={navigate}>Accueil</NavLink><span>/</span><span aria-current="page">{links.find(link => link.page === page)?.label}</span></nav>
      <div className="account-heading"><span className="section-kicker">Espace personnel</span><h1>{page === 'profile' ? 'Mon profil' : page === 'my-recipes' ? 'Mes recettes' : 'Mes favoris'}</h1><p>{page === 'profile' ? 'Gérez les informations et les préférences de votre compte.' : page === 'my-recipes' ? 'Consultez et modifiez vos recettes.' : 'Consultez les recettes ajoutées à vos favoris.'}</p></div>
      <div className="account-layout">
        <aside className="account-sidebar">
          {profile && <div className="account-sidebar-user"><InitialAvatar profile={{...profile, avatar: sidebarAvatar}}/><div><strong>{profile.firstName} {profile.lastName}</strong><span>{profile.email}</span></div></div>}
          <nav aria-label="Espace personnel">{links.map(link => <NavLink to={link.href} navigate={navigate} key={link.page}><span className={page === link.page ? 'account-nav-active' : ''}>{link.label}<span aria-hidden="true">›</span></span></NavLink>)}</nav>
        </aside>
        <section className="account-main">
          {page === 'profile' && profile && <>
            <div className="account-section-header"><div><span className="section-kicker">Mes informations</span><h2>Mon profil</h2></div></div>
            <form onSubmit={saveProfile} className="account-profile-form">
              <div className="account-photo-control"><span className="account-avatar-frame"><InitialAvatar profile={{...profile,avatar: resolvedAvatar || undefined}} large/></span><div><ImagePicker label="Photo de profil" hasImage={Boolean(avatar)} onChange={onPhoto}/>{avatar && <button type="button" className="account-text-button" onClick={() => setAvatar('')}>Supprimer la photo</button>}</div></div>
              {saveError && <p role="alert" className="account-error">{saveError}</p>}
              {photoError && <p role="alert" className="account-error">{photoError}</p>}
              <div className="account-form-grid"><label>Prénom<input required maxLength={70} autoComplete="given-name" value={firstName} onChange={event => setFirstName(event.target.value)}/></label><label>Nom<input required maxLength={70} autoComplete="family-name" value={lastName} onChange={event => setLastName(event.target.value)}/></label><label className="account-field-wide">Adresse e-mail<input type="email" readOnly value={profile.email}/><small>Adresse de connexion et de réinitialisation du mot de passe.</small></label><label className="account-field-wide">Biographie<textarea maxLength={300} rows={4} value={bio} onChange={event => setBio(event.target.value)} placeholder="Par exemple, vos spécialités culinaires"/></label></div>
              <div className="account-preferences"><h3>Mes préférences</h3><label><span><strong>Mode développeur</strong><small>Affiche les outils d'import/export JSON dans l'éditeur de recettes.</small></span><ToggleSwitch label="Mode développeur" checked={developerMode} onChange={onDeveloperModeChange}/></label><label><span><strong>Recevoir les actualités</strong><small>Préférence de réception des actualités.</small></span><ToggleSwitch label="Recevoir les actualités" checked={newsletter} onChange={setNewsletter}/></label><label><span><strong>Recettes publiques</strong><small>Visibilité proposée par défaut pour les nouvelles recettes.</small></span><ToggleSwitch label="Recettes publiques" checked={publicRecipes} onChange={setPublicRecipes}/></label></div>
              {notice && <p role="status" className="account-success">{notice}</p>}
              <div className="account-form-actions"><button className="account-primary" type="submit" disabled={saving}>Enregistrer les modifications</button></div>
            </form>
            <AccountPassword token={token} email={profile.email} navigate={navigate}/>
          </>}
          {page !== 'profile' && <>
            <div className="account-section-header"><div><span className="section-kicker">{page === 'favorites' ? 'Ma sélection' : 'Ma cuisine'}</span><h2>{page === 'favorites' ? 'Mes favoris' : 'Mes recettes'}</h2></div>{page === 'my-recipes' && <button className="account-primary" onClick={() => navigate('/recipes/new')}>+ Nouvelle recette</button>}</div>
            <div className="account-controls"><label className="account-search"><span className="sr-only">Rechercher dans mes recettes</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une recette..."/></label><label className="account-sort">Trier par <select value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="recent">Plus récentes</option><option value="name">Nom A-Z</option><option value="time">Plus rapides</option></select></label></div>
            {page === 'favorites' && favoritesError ? <p role="alert">Impossible de charger les favoris.</p>
              : page === 'favorites' && favoritesPending ? <p role="status">Chargement des favoris…</p>
              : filtered.length ? <div className="account-recipe-grid">{filtered.map(recipe => <article className="account-recipe-card" key={recipe.id}><NavLink to={recipePath(recipe.id)} navigate={navigate}><AccountRecipeImage recipe={recipe} token={token}/></NavLink><div className="account-recipe-body"><span className="card-category">{recipe.category}</span><h3><NavLink to={recipePath(recipe.id)} navigate={navigate}>{recipe.title}</NavLink></h3><p>{formatTime(recipe.time)} · {recipe.difficulty}</p><div className="account-recipe-actions">{page === 'favorites' ? <button onClick={() => onFavoriteToggle(recipe.id)}>Retirer des favoris</button> : <><button onClick={() => navigate(`/recipes/${recipe.id}/edit`)}>Modifier</button><button className="account-danger" onClick={() => setPendingDelete(recipe)}>Supprimer</button></>}</div></div></article>)}</div> : source.length === 0 ? <EmptyContent kind={page} navigate={navigate}/> : <div className="account-no-results"><h3>Aucune recette ne correspond</h3><p>Essayez d’autres mots-clés.</p><button onClick={() => setQuery('')}>Effacer la recherche</button></div>}
          </>}
        </section>
      </div>
    </div>
  {pendingDelete && <ConfirmDialog title="Supprimer cette recette ?" description={`« ${pendingDelete.title} » sera supprimée définitivement.`} confirmLabel="Supprimer la recette" destructive onCancel={() => setPendingDelete(null)} onConfirm={() => { onDeleteRecipe(pendingDelete.id); setPendingDelete(null); }}/>}
  </main>;
}
