import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import type { DemoUser } from './AuthPages';
import { recipePath, type Recipe } from './recipe-data';
import './account.css';

export type Profile = DemoUser & { avatar?: string; bio: string; newsletter: boolean; publicRecipes: boolean };
export type AccountRoute = 'profile' | 'my-recipes' | 'favorites';
type Props = {
  page: AccountRoute;
  profile: Profile | null;
  recipes: Recipe[];
  favorites: number[];
  myRecipes: Recipe[];
  navigate: (path: string) => void;
  onProfileChange: (profile: Profile) => void;
  onFavoriteToggle: (id: number) => void;
  onDeleteRecipe: (id: number) => void;
  developerMode: boolean;
  onDeveloperModeChange: (enabled: boolean) => void;
  themePreference: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
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
    <h2>{kind === 'favorites' ? 'Pas encore de recettes favorites' : 'Ton carnet attend sa première recette'}</h2>
    <p>{kind === 'favorites' ? 'Explore le catalogue et garde tes découvertes gourmandes ici.' : 'C’est le moment d’ajouter une recette dont tu es fier.'}</p>
    <button className="account-primary" onClick={() => navigate(kind === 'favorites' ? '/recipes' : '/recipes/new')}>{kind === 'favorites' ? 'Explorer les recettes' : 'Créer une recette'}</button>
  </div>;
}

export function AccountPage({ page, profile, recipes, favorites, myRecipes, navigate, onProfileChange, onFavoriteToggle, onDeleteRecipe, developerMode, onDeveloperModeChange, themePreference, onThemeChange }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'name' | 'time'>('recent');
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? '');
  const [newsletter, setNewsletter] = useState(profile?.newsletter ?? false);
  const [publicRecipes, setPublicRecipes] = useState(profile?.publicRecipes ?? true);
  const [notice, setNotice] = useState('');
  const [photoError, setPhotoError] = useState('');

  const requireProfile = page !== 'favorites';
  if (!profile && requireProfile) {
    return <main className="account-guest"><span className="section-kicker">Ton espace personnel</span><h1>Connecte-toi pour continuer</h1><p>Pour le moment, tu peux explorer ces pages avec le compte de démonstration.</p><button className="account-primary" onClick={() => navigate('/login')}>Découvrir la connexion</button></main>;
  }

  const source = page === 'favorites' ? recipes.filter(recipe => favorites.includes(recipe.id)) : myRecipes;
  const filtered = source.filter(recipe => [recipe.title,recipe.category,recipe.description].join(' ').toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr'))).sort((a,b) => sort === 'name' ? a.title.localeCompare(b.title,'fr') : sort === 'time' ? a.time-b.time : (page === 'my-recipes' ? b.id-a.id : 0));

  const onPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2_000_000) {
      setPhotoError('Choisis une image JPG, PNG ou WebP de moins de 2 Mo.'); event.target.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setAvatar(reader.result); };
    reader.onerror = () => setPhotoError('Impossible de lire cette image.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };
  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || !firstName.trim() || !lastName.trim()) return;
    onProfileChange({ ...profile, firstName:firstName.trim(), lastName:lastName.trim(), bio:bio.trim(), avatar:avatar || undefined, newsletter, publicRecipes });
    setNotice('Profil de démonstration mis à jour (non enregistré sur le serveur).');
  };

  return <main className="account-page">
    <div className="account-container">
      <nav className="breadcrumbs" aria-label="Fil d’Ariane"><NavLink to="/" navigate={navigate}>Accueil</NavLink><span>/</span><span aria-current="page">{links.find(link => link.page === page)?.label}</span></nav>
      <div className="account-heading"><span className="section-kicker">Mon espace gourmand</span><h1>{page === 'profile' ? 'Un profil qui te ressemble.' : page === 'my-recipes' ? 'Mes recettes maison.' : 'Mes coups de cœur.'}</h1><p>{page === 'profile' ? 'Personnalise ton espace et les informations de ton compte.' : page === 'my-recipes' ? 'Retrouve, modifie et partage tes créations culinaires.' : 'Toutes les bonnes idées que tu as envie de retrouver.'}</p></div>
      <div className="account-layout">
        <aside className="account-sidebar">
          {profile && <div className="account-sidebar-user"><InitialAvatar profile={profile}/><div><strong>{profile.firstName} {profile.lastName}</strong><span>Compte de démonstration</span></div></div>}
          <nav aria-label="Espace personnel">{links.map(link => <NavLink to={link.href} navigate={navigate} key={link.page}><span className={page === link.page ? 'account-nav-active' : ''}>{link.label}<span aria-hidden="true">›</span></span></NavLink>)}</nav>
          <p>Les modifications restent en mémoire jusqu’au rechargement de la page. Aucune donnée n'est envoyée.</p>
        </aside>
        <section className="account-main">
          {page === 'profile' && profile && <>
            <div className="account-section-header"><div><span className="section-kicker">Mes informations</span><h2>Mon profil</h2></div></div>
            <form onSubmit={saveProfile} className="account-profile-form">
              <div className="account-photo-control"><span className="account-avatar-frame"><InitialAvatar profile={{...profile,avatar:avatar || undefined}} large/></span><div><strong>Photo de profil</strong><p>JPG, PNG ou WebP, 2 Mo maximum.</p><label className="account-upload-label" htmlFor="account-avatar-file">Choisir une photo</label><input id="account-avatar-file" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto}/>{avatar && <button type="button" className="account-text-button" onClick={() => setAvatar('')}>Supprimer la photo</button>}</div></div>
              {photoError && <p role="alert" className="account-error">{photoError}</p>}
              <div className="account-form-grid"><label>Prénom<input required maxLength={70} autoComplete="given-name" value={firstName} onChange={event => setFirstName(event.target.value)}/></label><label>Nom<input required maxLength={70} autoComplete="family-name" value={lastName} onChange={event => setLastName(event.target.value)}/></label><label className="account-field-wide">Adresse e-mail<input type="email" readOnly value={profile.email}/><small>L'email sera modifiable après vérification via l'API.</small></label><label className="account-field-wide">Quelques mots sur toi<textarea maxLength={300} rows={4} value={bio} onChange={event => setBio(event.target.value)} placeholder="Ce que tu aimes cuisiner..."/></label></div>
              <div className="account-preferences"><h3>Mes préférences</h3><div className="account-theme-preference"><div><strong>Apparence</strong><small>Choisis un thème ou suis les réglages de ton appareil.</small></div><div className="account-theme-segments" role="group" aria-label="Apparence du site">{([['light','Clair'],['dark','Sombre'],['system','Système']] as const).map(([value,label]) => <button type="button" key={value} className={themePreference === value ? 'is-active' : ''} aria-pressed={themePreference === value} onClick={() => onThemeChange(value)}>{label}</button>)}</div></div><label><span><strong>Mode développeur</strong><small>Affiche les outils d'import/export JSON dans l'éditeur de recettes.</small></span><span className="developer-mode-switch"><input type="checkbox" aria-label="Mode développeur" checked={developerMode} onChange={event => onDeveloperModeChange(event.target.checked)}/><span className="developer-mode-track" aria-hidden="true"/></span></label><label><span><strong>Recevoir les actualités</strong><small>Préférence de démonstration, aucun email envoyé.</small></span><input type="checkbox" checked={newsletter} onChange={event => setNewsletter(event.target.checked)}/></label><label><span><strong>Recettes publiques</strong><small>La visibilité sera prise en compte avec l'API.</small></span><input type="checkbox" checked={publicRecipes} onChange={event => setPublicRecipes(event.target.checked)}/></label></div>
              <div className="account-security"><div><h3>Sécurité du compte</h3><p>Modification du mot de passe et suppression du compte seront disponibles lorsque l'API sera branchée.</p></div><button type="button" disabled title="Disponible après l'intégration de l'API">Modifier mon mot de passe</button></div>
              {notice && <p role="status" className="account-success">{notice}</p>}
              <div className="account-form-actions"><button className="account-primary" type="submit">Enregistrer les modifications</button></div>
            </form>
          </>}
          {page !== 'profile' && <>
            <div className="account-section-header"><div><span className="section-kicker">{page === 'favorites' ? 'Ma sélection' : 'Ma cuisine'}</span><h2>{page === 'favorites' ? 'Mes favoris' : 'Mes recettes'}</h2></div>{page === 'my-recipes' && <button className="account-primary" onClick={() => navigate('/recipes/new')}>+ Nouvelle recette</button>}</div>
            <div className="account-controls"><label className="account-search"><span className="sr-only">Rechercher dans mes recettes</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une recette..."/></label><label className="account-sort">Trier par <select value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="recent">Plus récentes</option><option value="name">Nom A-Z</option><option value="time">Plus rapides</option></select></label></div>
            {filtered.length ? <div className="account-recipe-grid">{filtered.map(recipe => <article className="account-recipe-card" key={recipe.id}><NavLink to={recipePath(recipe.id)} navigate={navigate}><img src={recipe.image} loading="lazy" alt={recipe.title}/></NavLink><div className="account-recipe-body"><span className="card-category">{recipe.category}</span><h3><NavLink to={recipePath(recipe.id)} navigate={navigate}>{recipe.title}</NavLink></h3><p>{recipe.time} min · {recipe.difficulty}</p><div className="account-recipe-actions">{page === 'favorites' ? <button onClick={() => onFavoriteToggle(recipe.id)}>Retirer des favoris</button> : <><button onClick={() => navigate(`/recipes/${recipe.id}/edit`)}>Modifier</button><button className="account-danger" onClick={() => { if (window.confirm(`Supprimer « ${recipe.title} » de tes recettes de démonstration ?`)) onDeleteRecipe(recipe.id); }}>Supprimer</button></>}</div></div></article>)}</div> : source.length === 0 ? <EmptyContent kind={page} navigate={navigate}/> : <div className="account-no-results"><h3>Aucune recette ne correspond</h3><p>Essaie d'autres mots-clés.</p><button onClick={() => setQuery('')}>Effacer la recherche</button></div>}
          </>}
        </section>
      </div>
    </div>
  </main>;
}
