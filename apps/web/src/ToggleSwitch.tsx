import './toggle-switch.css';

export function ToggleSwitch({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return <span className="toggle-switch">
    <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={event => onChange(event.target.checked)}/>
    <span className="toggle-track" aria-hidden="true"/>
  </span>;
}
