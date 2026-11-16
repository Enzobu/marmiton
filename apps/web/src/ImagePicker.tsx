import { useId, type ChangeEvent } from 'react';
import { ACCEPTED_RECIPE_IMAGE_TYPES, MAX_IMAGE_MB } from './recipe-draft';
import './image-picker.css';

export function ImagePicker({ label, hasImage, onChange, onRemove }: {
  label: string;
  hasImage: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
}) {
  const id = useId();
  return <div className="image-picker">
    <label className="image-picker-label" id={id + "-label"} htmlFor={id + "-file"}>{label}</label>
    <div className="image-picker-row">
      <label className="image-picker-control">
        <input id={id + "-file"} type="file" className="sr-only" accept={ACCEPTED_RECIPE_IMAGE_TYPES.join(',')} aria-labelledby={id + "-label"} aria-describedby={id} onChange={onChange}/>
        <span className="image-picker-action" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4"/></svg>
          {hasImage ? 'Remplacer la photo' : 'Choisir une photo'}
        </span>
        <span className="image-picker-status" aria-live="polite">{hasImage ? 'Photo disponible' : 'Aucune photo sélectionnée'}</span>
      </label>
      {hasImage && onRemove && <button type="button" className="image-picker-remove" onClick={onRemove}>Retirer la photo</button>}
    </div>
    <small id={id}>JPG, PNG ou WebP, {MAX_IMAGE_MB} Mo maximum.</small>
  </div>;
}
