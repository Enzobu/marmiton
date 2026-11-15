const storageKey = 'petitsplats.session';

export function readSession() {
  try { return sessionStorage.getItem(storageKey) ?? localStorage.getItem(storageKey); }
  catch { return null; }
}

export function saveSession(token: string | null, remember = false) {
  try {
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
    if (token) (remember ? localStorage : sessionStorage).setItem(storageKey, token);
  } catch { /* Storage may be disabled. */ }
}
