import { CLASSES } from '../../data/streams.js';
import './ClassToggle.css';

// Pill toggle: the chosen pill drops into place, the other one tilts away.
export default function ClassToggle({ value, onChange }) {
  return (
    <div className="ctoggle" role="radiogroup" aria-label="Class">
      {CLASSES.map((c) => {
        const active = c.value === value;
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`ctoggle__pill${active ? ' is-active' : ''}`}
            onClick={() => onChange(c.value)}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
