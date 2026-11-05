import { useState, type FormEvent } from 'react';
import './auth.css';

export type DemoUser = { firstName: string; lastName: string; email: string };
type AuthProps = { page: 'login' | 'register' | 'forgot' | 'verify' | 'reset'; navigate: (path: string) => void; onDemoLogin: (user: DemoUser) => void };

export const AUTH_ROUTES = {
  login: '/connexion',
  register: '/inscription',
  forgot: '/mot-de-passe-oublie',
  verify: '/verification-email',
  reset: '/reinitialiser-mot-de-passe'
} as const;

export const normalizeEmail = (value: string) => value.trim().toLocaleLowerCase('fr');
export const passwordChecks = (password: string) => ({
  length: password.length >= 12,
  lower: /[a-z]/.test(password),
  upper: /[A-Z]/.test(password),
  digit: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password)
});
export const isPasswordValid = (password: string) => Object.values(passwordChecks(password)).every(Boolean);
const titleByPage: Record<AuthProps['page'], string> = {
  login: 'Heureux de te retrouver.',
  register: 'Bienvenue à table.',
  forgot: 'Retrouvons ton compte.',
  verify: 'Encore une petite étape.',
  reset: 'Un nouveau départ.'
};

type IconName = 'eye' | 'eye-off' | 'mail' | 'lock' | 'arrow' | 'check' | 'back' | 'user' | 'shield' | 'chef';
function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    'eye-off': <><path d="m3 3 18 18M10.6 5.1A11.5 11.5 0 0 1 12 5c6 0 10 7 10 7a15 15 0 0 1-3 3.6M6.3 6.5C3.6 8.2 2 12 2 12s4 7 10 7c1.4 0 2.7-.4 3.8-1"/><path d="M10 10a3 3 0 0 0 4 4"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    check: <path d="m4 12 5 5L20 6"/>,
    back: <path d="m14 6-6 6 6 6M8 12h12"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.3-7 8-7s8 2.5 8 7"/></>,
    shield: <><path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6Z"/><path d="m8 12 3 3 5-6"/></>,
    chef: <><path d="M6 13a4 4 0 0 1-1-7 5 5 0 0 1 9-2 4 4 0 1 1 5 8v7H6Z"/><path d="M6 17h13"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function RouteLink({ to, children, navigate, className }: { to: string; children: React.ReactNode; navigate: AuthProps['navigate']; className?: string }) {
  return <a href={to} className={className} onClick={event => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(to); } }}>{children}</a>;
}
function PasswordField({ id, label, value, onChange, autoComplete, placeholder, required = true }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string; placeholder: string; required?: boolean }) {
  const [show, setShow] = useState(false);
  return <div className="auth-field"><label htmlFor={id}>{label}</label><div className="auth-input-wrap"><Icon name="lock"/><input id={id} type={show ? 'text' : 'password'} value={value} autoComplete={autoComplete} onChange={event => onChange(event.target.value)} placeholder={placeholder} required={required}/><button type="button" className="auth-reveal" aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={show} onClick={() => setShow(previous => !previous)}><Icon name={show ? 'eye-off' : 'eye'}/></button></div></div>;
}
function EmailField({ value, onChange, autoComplete = 'email' }: { value: string; onChange: (value: string) => void; autoComplete?: string }) {
  return <div className="auth-field"><label htmlFor="auth-email">Adresse e-mail</label><div className="auth-input-wrap"><Icon name="mail"/><input id="auth-email" type="email" required maxLength={254} autoComplete={autoComplete} placeholder="exemple@domaine.fr" value={value} onChange={event => onChange(event.target.value)}/></div></div>;
}

export function AuthPage({ page, navigate, onDemoLogin }: AuthProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'info' | 'error'>('info');
  const [submitted, setSubmitted] = useState(false);
  const checks = passwordChecks(password);

  const inform = (value: string, type: 'info' | 'error' = 'info') => { setFeedback(value); setFeedbackType(type); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (page === 'register') {
      if (!firstName.trim() || !lastName.trim()) { inform('Renseigne ton prénom et ton nom.', 'error'); return; }
      if (!isPasswordValid(password)) { inform('Ton mot de passe doit respecter tous les critères de sécurité.', 'error'); return; }
      if (confirm !== password) { inform('Les mots de passe ne correspondent pas.', 'error'); return; }
      setSubmitted(true);
      inform('Le formulaire est prêt. L’envoi de l’e-mail de vérification sera disponible avec l’API. Aucun compte n’a été créé.');
      return;
    }
    if (page === 'login') { inform('La connexion réelle sera activée avec l’API. Tu peux essayer le mode démonstration sans utiliser de mot de passe.'); return; }
    if (page === 'forgot') {
      setSubmitted(true);
      inform('Le parcours est prêt, mais aucun e-mail n’a été envoyé. La récupération sera activée avec l’API.');
      return;
    }
    if (page === 'verify') { inform('La validation des liens de vérification sera disponible avec l’API.'); return; }
    if (!isPasswordValid(password) || confirm !== password) { inform('Vérifie les critères du mot de passe et sa confirmation.', 'error'); return; }
    inform('La réinitialisation sera activée avec l’API. Aucun mot de passe n’a été modifié.');
  };

  return <main className="auth-page">
    <div className="auth-layout">
      <section className="auth-card" aria-labelledby="auth-title">
        <RouteLink to="/" navigate={navigate} className="auth-back"><Icon name="back" size={16}/> Retour à l’accueil</RouteLink>
        <div className="auth-mark"><Icon name={page === 'forgot' || page === 'reset' ? 'lock' : page === 'verify' ? 'mail' : 'chef'} size={27}/></div>
        <span className="section-kicker">{page === 'login' ? 'Ton espace gourmand' : page === 'register' ? 'Rejoins la communauté' : 'Sécurité du compte'}</span>
        <h1 id="auth-title">{titleByPage[page]}</h1>
        <p className="auth-lead">{page === 'login' ? 'Connecte-toi pour retrouver tes bonnes idées et tes recettes préférées.' : page === 'register' ? 'Crée ton carnet de recettes, sauvegarde tes coups de cœur et partage tes créations.' : page === 'forgot' ? 'Renseigne ton adresse e-mail. Bientôt, tu recevras un lien pour choisir un nouveau mot de passe.' : page === 'verify' ? 'Lorsque l’API sera en place, tu pourras confirmer ton adresse e-mail grâce au lien reçu dans ta boîte.' : 'Choisis un mot de passe solide pour protéger ton compte.'}</p>

        {page === 'verify' ? <div className="auth-verification">
          <span className="auth-verification-icon"><Icon name="mail" size={29}/></span>
          <h2>Vérification par e-mail</h2>
          <p>Un lien à usage unique sera envoyé lors de l’inscription. L’envoi d’e-mails et la validation des liens ne sont pas encore actifs.</p>
          <div className="auth-alert" role="status">Mode démonstration : aucun e-mail n’a été envoyé.</div>
          <RouteLink to="/connexion" navigate={navigate} className="auth-primary auth-link-button">Retour à la connexion <Icon name="arrow" size={18}/></RouteLink>
        </div> :
        <form className="auth-form" onSubmit={submit}>
          {page === 'register' && <div className="auth-name-grid"><div className="auth-field"><label htmlFor="auth-firstname">Prénom</label><div className="auth-input-wrap"><Icon name="user"/><input id="auth-firstname" value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="given-name" placeholder="Camille" required maxLength={70}/></div></div><div className="auth-field"><label htmlFor="auth-lastname">Nom</label><div className="auth-input-wrap"><Icon name="user"/><input id="auth-lastname" value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="family-name" placeholder="Martin" required maxLength={70}/></div></div></div>}
          {(page === 'login' || page === 'register' || page === 'forgot') && <EmailField value={email} onChange={setEmail}/>}
          {(page === 'login' || page === 'register' || page === 'reset') && <PasswordField id="auth-password" label={page === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'} value={password} onChange={setPassword} autoComplete={page === 'login' ? 'current-password' : 'new-password'} placeholder={page === 'login' ? 'Ton mot de passe' : 'Au moins 12 caractères'}/>}
          {(page === 'register' || page === 'reset') && <>
            <div className="auth-password-rules" aria-label="Critères du mot de passe">
              {([['length','12 caractères minimum'],['lower','Une minuscule'],['upper','Une majuscule'],['digit','Un chiffre'],['special','Un caractère spécial']] as const).map(([key,label]) => <span key={key} className={checks[key] ? 'valid' : ''}><Icon name="check" size={13}/>{label}</span>)}
            </div>
            <PasswordField id="auth-confirm" label="Confirmer le mot de passe" value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Répète ton mot de passe"/>
          </>}
          {page === 'login' && <div className="auth-form-options"><label className="auth-checkbox"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)}/>Se souvenir de moi</label><RouteLink navigate={navigate} to="/mot-de-passe-oublie">Mot de passe oublié ?</RouteLink></div>}
          {feedback && <div className={`auth-alert ${feedbackType === 'error' ? 'auth-alert-error' : ''}`} role={feedbackType === 'error' ? 'alert' : 'status'}>{feedback}</div>}
          <button className="auth-primary" type="submit">{page === 'login' ? 'Se connecter' : page === 'register' ? 'Créer mon compte' : page === 'forgot' ? 'Demander un lien' : 'Modifier mon mot de passe'}<Icon name="arrow" size={18}/></button>
          {page === 'login' && <button className="auth-demo-button" type="button" onClick={() => onDemoLogin({ firstName: 'Camille', lastName: 'Martin', email: 'demo@example.invalid' })}>Explorer avec un compte de démonstration</button>}
          {submitted && page === 'register' && <button className="auth-demo-button" type="button" onClick={() => navigate('/verification-email')}>Découvrir l’écran de vérification</button>}
          {submitted && page === 'forgot' && <button className="auth-demo-button" type="button" onClick={() => navigate('/reinitialiser-mot-de-passe')}>Découvrir l’écran de réinitialisation</button>}
        </form>}

        <div className="auth-bottom">{page === 'login' ? <>Pas encore de compte ? <RouteLink to="/inscription" navigate={navigate}>S’inscrire</RouteLink></> : page === 'register' ? <>Déjà inscrit ? <RouteLink to="/connexion" navigate={navigate}>Se connecter</RouteLink></> : <RouteLink to="/connexion" navigate={navigate}>Retour à la connexion</RouteLink>}</div>
        <p className="auth-demo-disclaimer"><Icon name="shield" size={14}/> Maquette interactive : aucune authentification ni transmission de mot de passe.</p>
      </section>
      <aside className="auth-story" aria-label="Inspiration cuisine">
        <div className="auth-story-photo" role="img" aria-label="Table garnie de bons plats faits maison"/>
        <div className="auth-story-content">
          <div className="auth-story-badge"><Icon name="chef" size={18}/> Les petits plats</div>
          <span className="auth-story-eyebrow">La cuisine qui rassemble</span>
          <h2>Les meilleures recettes sont celles qu’on partage.</h2>
          <p>Un carnet gourmand, des idées pour tous les jours et plein de souvenirs à cuisiner.</p>
          <div className="auth-story-dots"><span/><span/><span/></div>
        </div>
      </aside>
    </div>
  </main>;
}
