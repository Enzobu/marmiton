import './theme-quick-access.css';

export type ThemePreference = 'light' | 'system' | 'dark';
type Props = { value: ThemePreference; disabled?: boolean; onChange: (value: ThemePreference) => void };

function ThemeIcon({ kind }: { kind: ThemePreference }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (kind === 'light') return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>;
  if (kind === 'system') return <svg {...common}><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8m-4-3v3"/></svg>;
  return <svg {...common}><path d="M20.4 15.8A8.5 8.5 0 0 1 8.2 3.6 8.5 8.5 0 1 0 20.4 15.8Z"/></svg>;
}

const themes = {
  system: { label: 'Système', next: 'light' },
  light: { label: 'Clair', next: 'dark' },
  dark: { label: 'Sombre', next: 'system' }
} satisfies Record<ThemePreference, { label: string; next: ThemePreference }>;

export function ThemeToggle({ value, disabled, onChange }: Props) {
  const { label, next } = themes[value];
  const description = `Thème actuel : ${label}. Passer au thème ${themes[next].label}.`;

  return <button
    type="button"
    disabled={disabled}
    className="theme-quick-trigger"
    aria-label={description}
    title={description}
    onClick={() => onChange(next)}
  >
    <ThemeIcon kind={value}/>
  </button>;
}
