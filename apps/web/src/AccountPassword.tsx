import { useState } from 'react';
import { ApiError, requestPasswordReset } from './api';

export function AccountPassword({ token, email, navigate }: {
  token: string | null;
  email: string;
  navigate: (path: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function requestLink() {
    if (busy || sent) return;
    if (!token) { navigate('/login'); return; }
    setBusy(true);
    setError('');
    try {
      await requestPasswordReset({ token });
      setSent(true);
    } catch (failure) {
      const status = failure instanceof ApiError ? failure.status : 0;
      if (status === 401) { navigate('/login'); return; }
      setError(status === 429 ? 'Trop de tentatives. Réessaie dans une minute.'
        : 'Impossible d’envoyer le lien de réinitialisation. Réessaie.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="account-security" aria-labelledby="account-security-title">
    <h3 id="account-security-title">Sécurité du compte</h3>
    <p>Un lien de réinitialisation sera envoyé à {email}.</p>
    {sent && <p role="status" className="account-success">Lien envoyé. Ouvre-le depuis ta boîte mail pour choisir ton nouveau mot de passe.</p>}
    {error && <p role="alert" className="account-error">{error}</p>}
    {!sent && <button className="account-primary" type="button" disabled={busy} onClick={requestLink}>
      {busy ? 'Envoi en cours…' : 'Envoyer un lien de réinitialisation'}
    </button>}
  </section>;
}
