import { useEffect, useId, useRef, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import './theme-quick-access.css';

type ThemePreference = 'light' | 'dark' | 'system';

export function ThemeQuickAccess({ value, onChange, path }: {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => setOpen(false), [path]);

  const selectTheme = (theme: ThemePreference) => {
    onChange(theme);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return <div className="theme-quick-access" ref={rootRef}>
    <button
      type="button"
      className="theme-quick-trigger"
      ref={triggerRef}
      aria-label="Changer le thème"
      title="Changer le thème"
      aria-expanded={open}
      aria-controls={open ? popoverId : undefined}
      aria-haspopup="true"
      onClick={() => setOpen(current => !current)}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>
      </svg>
    </button>
    {open && <div className="theme-quick-popover" id={popoverId} role="group" aria-label="Sélection rapide du thème">
      <p>Apparence</p>
      <ThemeToggle value={value} onChange={selectTheme}/>
    </div>}
  </div>;
}
