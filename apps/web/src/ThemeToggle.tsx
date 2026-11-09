type ThemePreference = 'light' | 'system' | 'dark';
type Props = { value: ThemePreference; onChange: (value: ThemePreference) => void };

function ThemeIcon({ kind }: { kind: ThemePreference }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (kind === 'light') return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>;
  if (kind === 'system') return <svg {...common}><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8m-4-3v3"/></svg>;
  return <svg {...common}><path d="M20.4 15.8A8.5 8.5 0 0 1 8.2 3.6 8.5 8.5 0 1 0 20.4 15.8Z"/></svg>;
}

const options: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Clair' },
  { value: 'system', label: 'Système' },
  { value: 'dark', label: 'Sombre' }
];

export function ThemeToggle({ value, onChange }: Props) {
  return <div className="account-theme-segments" role="group" aria-label="Apparence du site" data-selected={value}>
    {options.map(option => <button key={option.value} type="button" title={option.label} aria-label={option.label} aria-pressed={value === option.value} className={value === option.value ? 'is-active' : ''} onClick={() => onChange(option.value)}><ThemeIcon kind={option.value}/></button>)}
  </div>;
}
