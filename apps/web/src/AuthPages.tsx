import { useState, type FormEvent } from 'react';
import { apiRequest, ApiError, requestPasswordReset } from './api';
import type { Profile } from './AccountPages';
import './auth.css';

type LoginResult = { accessToken: string; profile: Profile };
type AuthProps = { page: 'login' | 'forgot' | 'reset'; navigate: (path: string) => void; onLogin: (session: LoginResult, remember: boolean) => void; onReset: () => void; sessionPending: boolean; signedIn: boolean };

export const AUTH_ROUTES = {
  login: '/login',
  forgot: '/forgot-password',
  reset: '/reset-password'
} as const;

export const normalizeEmail = (value: string) => value.trim().toLocaleLowerCase('fr');
export const passwordChecks = (password: string) => ({
  length: password.length >= 12,
  lower: /[a-z]/.test(password),
  upper: /[A-Z]/.test(password),
  digit: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password)
});
export const isPasswordValid = (password: string) => password.length <= 128 && Object.values(passwordChecks(password)).every(Boolean);
const titleByPage: Record<AuthProps['page'], string> = {
  login: 'Connexion',
  forgot: 'Mot de passe oublié',
  reset: 'Réinitialisation du mot de passe'
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
function PasswordField({ id, label, value, onChange, autoComplete, placeholder, required = true }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string; placeholder?: string; required?: boolean }) {
  const [show, setShow] = useState(false);
  return <div className="auth-field"><label htmlFor={id}>{label}</label><div className="auth-input-wrap"><Icon name="lock"/><input id={id} type={show ? 'text' : 'password'} value={value} maxLength={128} autoComplete={autoComplete} onChange={event => onChange(event.target.value)} placeholder={placeholder} required={required}/><button type="button" className="auth-reveal" aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={show} onClick={() => setShow(previous => !previous)}><Icon name={show ? 'eye-off' : 'eye'}/></button></div></div>;
}
function EmailField({ value, onChange, autoComplete = 'email' }: { value: string; onChange: (value: string) => void; autoComplete?: string }) {
  return <div className="auth-field"><label htmlFor="auth-email">Adresse e-mail</label><div className="auth-input-wrap"><Icon name="mail"/><input id="auth-email" type="email" required maxLength={254} autoComplete={autoComplete} placeholder="exemple@domaine.fr" value={value} onChange={event => onChange(event.target.value)}/></div></div>;
}

export function AuthPage({ page, navigate, onLogin, onReset, sessionPending, signedIn }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'info' | 'error'>('info');
  const [busy, setBusy] = useState(false);
  const checks = passwordChecks(password);
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  const hasResetToken = Boolean(token && /^[A-Za-z0-9_-]{43}$/.test(token));

  const inform = (value: string, type: 'info' | 'error' = 'info') => { setFeedback(value); setFeedbackType(type); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (page === 'reset' && (!isPasswordValid(password) || confirm !== password)) {
      inform('Vérifiez que le mot de passe respecte les critères et que la confirmation est identique.', 'error');
      return;
    }
    if (page === 'reset' && !hasResetToken) {
      inform('Ce lien est invalide. Veuillez demander un nouveau lien.', 'error');
      return;
    }
    setBusy(true);
    inform('');
    try {
      if (page === 'forgot') {
        await requestPasswordReset({ email });
        inform('Si cette adresse est associée à un compte, un lien de réinitialisation vous sera envoyé.');
      } else {
        const result = await apiRequest<LoginResult>(page === 'login' ? '/auth/login' : '/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(page === 'login' ? { email, password, remember } : { token, password }),
        });
        if (page === 'login') onLogin(result, remember);
        else onReset();
      }
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0;
      inform(status === 429 ? 'Trop de tentatives. Réessayez dans une minute.'
        : page === 'login' && status === 401 ? 'Adresse e-mail ou mot de passe incorrect.'
        : page === 'reset' && status === 400 ? 'Ce lien a expiré ou a déjà été utilisé.'
        : 'Impossible de traiter la demande. Veuillez réessayer.', 'error');
    } finally { setBusy(false); }
  };

  return <main className="auth-page">
    <div className="auth-layout">
      <section className="auth-card" aria-labelledby="auth-title">
        <RouteLink to="/" navigate={navigate} className="auth-back"><Icon name="back" size={16}/> Retour à l’accueil</RouteLink>
        <div className="auth-mark"><Icon name={page === 'forgot' || page === 'reset' ? 'lock' : 'chef'} size={27}/></div>
        <span className="section-kicker">{page === 'login' ? 'Espace personnel' : 'Sécurité du compte'}</span>
        <h1 id="auth-title">{titleByPage[page]}</h1>
        <p className="auth-lead">{page === 'login' ? 'Connectez-vous pour accéder à vos recettes et à vos favoris.' : page === 'forgot' ? 'Saisissez l’adresse e-mail de votre compte pour recevoir un lien de réinitialisation.' : 'Définissez un nouveau mot de passe pour votre compte.'}</p>

        {page === 'reset' && !hasResetToken ? <div className="auth-alert" role="status">
          Ouvrez le lien de réinitialisation reçu par e-mail. <RouteLink to="/forgot-password" navigate={navigate}>Demander un lien</RouteLink>
        </div> : <form className="auth-form" onSubmit={submit}>
          {(page === 'login' || page === 'forgot') && <EmailField value={email} onChange={setEmail}/>}
          {(page === 'login' || page === 'reset') && <PasswordField id="auth-password" label={page === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'} value={password} onChange={setPassword} autoComplete={page === 'login' ? 'current-password' : 'new-password'} placeholder={page === 'login' ? 'Mot de passe' : 'Au moins 12 caractères'}/>}
          {(page === 'reset') && <>
            <div className="auth-password-rules" aria-label="Critères du mot de passe">
              {([['length','12 caractères minimum'],['lower','Une minuscule'],['upper','Une majuscule'],['digit','Un chiffre'],['special','Un caractère spécial']] as const).map(([key,label]) => <span key={key} className={checks[key] ? 'valid' : ''}><Icon name="check" size={13}/>{label}</span>)}
            </div>
            <PasswordField id="auth-confirm" label="Confirmer le mot de passe" value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Confirmez le mot de passe"/>
          </>}
          {page === 'login' && <div className="auth-form-options"><label className="auth-checkbox"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)}/>Se souvenir de moi</label><RouteLink navigate={navigate} to="/forgot-password">Mot de passe oublié ?</RouteLink></div>}
          {feedback && <div className={`auth-alert ${feedbackType === 'error' ? 'auth-alert-error' : ''}`} role={feedbackType === 'error' ? 'alert' : 'status'}>{feedback}</div>}
          <button className="auth-primary" type="submit" disabled={busy}>{page === 'login' ? 'Se connecter' : page === 'forgot' ? 'Demander un lien' : 'Modifier mon mot de passe'}<Icon name="arrow" size={18}/></button>
        </form>}
        {page !== 'login' && !sessionPending && <div className="auth-bottom">
          <RouteLink to={signedIn ? '/profile' : '/login'} navigate={navigate}>
            {signedIn ? 'Retour au profil' : 'Retour à la connexion'}
          </RouteLink>
        </div>}
      </section>
      <aside className="auth-story" aria-label="Inspiration cuisine">
        <div className="auth-story-photo" role="img" aria-label="Table garnie de bons plats faits maison"/>
        <div className="auth-story-content">
          <div className="auth-story-badge"><Icon name="chef" size={18}/> Les petits plats</div>
          <span className="auth-story-eyebrow">La cuisine qui rassemble</span>
          <h2>Votre carnet de recettes</h2>
          <p>Créez vos recettes et retrouvez vos favoris dans un même espace.</p>
          <div className="auth-story-dots"><span/><span/><span/></div>
        </div>
      </aside>
    </div>
  </main>;
}
