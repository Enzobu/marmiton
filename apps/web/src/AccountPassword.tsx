import { useState, type FormEvent } from 'react';
import { ApiError, apiRequest, authHeaders } from './api';
import { isPasswordValid, PasswordField } from './AuthPages';

export function AccountPassword({ token, navigate }: { token: string | null; navigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function close() {
    setCurrent('');
    setNext('');
    setConfirmation('');
    setError('');
    setOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!isPasswordValid(next)) {
      setError('Le nouveau mot de passe doit respecter les critères affichés.');
      return;
    }
    if (next === current || next !== confirmation) {
      setError(next === current ? 'Choisis un mot de passe différent de l’actuel.' : 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      close();
      setSuccess(true);
    } catch (failure) {
      const status = failure instanceof ApiError ? failure.status : 0;
      setError(status === 403 ? 'Le mot de passe actuel est incorrect.'
        : status === 401 ? 'Ta session a expiré. Reconnecte-toi.'
        : status === 429 ? 'Trop de tentatives. Réessaie dans une minute.'
        : 'Impossible de modifier le mot de passe. Réessaie.');
      if (status === 401) navigate('/login');
    } finally {
      setBusy(false);
    }
  }

  return <section className="account-security" aria-labelledby="account-security-title">
    <h3 id="account-security-title">Sécurité du compte</h3>
    {success && <p role="status" className="account-success">Mot de passe modifié. Tes autres sessions ont été fermées.</p>}
    {!open && <button className="account-primary" type="button" onClick={() => { setSuccess(false); setOpen(true); }}>Modifier mon mot de passe</button>}
    {open && <form className="auth-form" onSubmit={submit}>
      <PasswordField id="account-current-password" label="Mot de passe actuel" value={current} onChange={setCurrent} autoComplete="current-password"/>
      <PasswordField id="account-new-password" label="Nouveau mot de passe" value={next} onChange={setNext} autoComplete="new-password"/>
      <p>De 12 à 128 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial.</p>
      <PasswordField id="account-confirm-password" label="Confirmer le nouveau mot de passe" value={confirmation} onChange={setConfirmation} autoComplete="new-password"/>
      {error && <p role="alert" className="account-error">{error}</p>}
      <div className="account-password-actions">
        <button type="button" className="account-text-button" disabled={busy} onClick={close}>Annuler</button>
        <button type="submit" className="account-primary" disabled={busy}>Enregistrer le mot de passe</button>
      </div>
    </form>}
  </section>;
}
