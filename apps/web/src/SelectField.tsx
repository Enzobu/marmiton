import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import './select-field.css';

type Option<T extends string> = { value: T; label: string };

export function SelectField<T extends string>({ label, value, options, onChange, className = '' }: {
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef({ text: '', time: 0 });
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [active, setActive] = useState(0);
  const selected = options.findIndex(option => option.value === value);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  useEffect(() => {
    const panel = list.current;
    const option = panel?.children[active];
    if (!open || !panel || !(option instanceof HTMLElement)) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < panel.scrollTop) panel.scrollTop = top;
    else if (bottom > panel.scrollTop + panel.clientHeight) panel.scrollTop = bottom - panel.clientHeight;
  }, [open, active]);

  function show(index: number) {
    const button = root.current?.querySelector('button');
    const bounds = button?.getBoundingClientRect();
    setAbove(Boolean(bounds && window.innerHeight - bounds.bottom < Math.min(260, options.length * 36 + 12)
      && bounds.top > window.innerHeight - bounds.bottom));
    search.current = { text: '', time: 0 };
    setActive(index);
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        if (open) setActive(index => Math.min(options.length - 1, Math.max(0, index + direction)));
        else show(selected >= 0 ? selected : direction > 0 ? 0 : options.length - 1);
        return;
      }
      case 'Home':
      case 'End': {
        if (!open) return;
        event.preventDefault();
        setActive(event.key === 'Home' ? 0 : options.length - 1);
        return;
      }
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) choose(active);
        else show(Math.max(0, selected));
        return;
      case 'Escape':
        if (!open) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
      case 'Tab':
        setOpen(false);
        return;
    }
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    const now = Date.now();
    const key = event.key.toLocaleLowerCase('fr');
    const prefix = open && now - search.current.time < 600 ? search.current.text + key : key;
    const match = options.findIndex(option => option.label.toLocaleLowerCase('fr').startsWith(prefix));
    if (match >= 0) {
      if (open) setActive(match);
      else show(match);
    }
    search.current = { text: prefix, time: now };
  }

  return <div className={`select-field ${className}`} ref={root}>
    <span id={id + '-label'}>{label}</span>
    <div className="select-field-control">
      <button type="button" role="combobox" className="select-field-trigger" aria-labelledby={id + '-label ' + id + '-value'}
        aria-expanded={open} aria-controls={id + '-list'} aria-activedescendant={open ? id + '-option-' + active : undefined}
        onClick={() => open ? setOpen(false) : show(Math.max(0, selected))}
        onBlur={() => setOpen(false)} onKeyDown={onKeyDown}>
        <span id={id + '-value'} className="select-field-value">{options[selected]?.label ?? value}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <ul ref={list} className="select-field-options" data-above={above} id={id + '-list'} role="listbox" aria-labelledby={id + '-label'} hidden={!open}>
        {options.map((option, index) => <li key={option.value} id={id + '-option-' + index} role="option" aria-selected={index === selected}
          data-active={index === active} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(index)}>
          {option.label}
          {index === selected && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>}
        </li>)}
      </ul>
    </div>
  </div>;
}
