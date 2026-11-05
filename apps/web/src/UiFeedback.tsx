import { useEffect, useRef, type KeyboardEvent } from 'react';
import './ui-feedback.css';

export type ToastMessage = { id: number; message: string; type: 'success' | 'error' | 'info' };

export function ToastRegion({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  return <div className="toast-region" aria-live="polite" aria-atomic="true">
    {toast && <div key={toast.id} className={`ui-toast ui-toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <span aria-hidden="true" className="ui-toast-symbol">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i'}</span>
      <span>{toast.message}</span>
      <button type="button" onClick={onDismiss} aria-label="Fermer la notification">×</button>
    </div>}
  </div>;
}

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel, destructive = false }: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); onCancel(); return; }
    if (event.key === 'Tab') {
      const elements = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
      if (!elements.length) return;
      if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements[elements.length-1].focus(); }
      else if (!event.shiftKey && document.activeElement === elements[elements.length-1]) { event.preventDefault(); elements[0].focus(); }
    }
  };
  return <div className="ui-confirm-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onCancel(); }}>
    <div className="ui-confirm-dialog" ref={panelRef} role="alertdialog" aria-modal="true" aria-labelledby="ui-confirm-title" aria-describedby="ui-confirm-description" onKeyDown={onKeyDown}>
      <div className="ui-confirm-mark" aria-hidden="true">{destructive ? '!' : '?'}</div>
      <h2 id="ui-confirm-title">{title}</h2>
      <p id="ui-confirm-description">{description}</p>
      <div className="ui-confirm-buttons">
        <button type="button" className="ui-confirm-cancel" ref={cancelRef} onClick={onCancel}>Annuler</button>
        <button type="button" className={destructive ? 'ui-confirm-delete' : 'ui-confirm-accept'} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>;
}

export function NotFoundPage({ navigate }: { navigate: (path: string) => void }) {
  return <main className="ui-not-found">
    <div className="ui-not-found-illustration" aria-hidden="true">404</div>
    <span className="section-kicker">La recette s'est échappée</span>
    <h1>Oups, cette page n'est pas au menu.</h1>
    <p>Le lien est peut-être incorrect ou la recette a disparu. Il reste plein de bonnes choses à découvrir !</p>
    <div><button className="account-primary" onClick={() => navigate('/recipes')}>Explorer les recettes</button><button className="ui-not-found-home" onClick={() => navigate('/')}>Retour à l'accueil</button></div>
  </main>;
}
