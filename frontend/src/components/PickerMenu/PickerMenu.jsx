import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMedia } from '../../hooks/useMedia.js';
import '../Select/Select.css';
import './PickerMenu.css';

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

// Multi-select menu with a custom trigger. value = [] means "All".
export default function PickerMenu({ title, options, value, onChange, allLabel, renderTrigger }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const isSheet = useMedia('(max-width: 640px)');

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isSheet) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open, isSheet]);

  const pick = (v) => {
    const picked = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    const ordered = options.map((o) => o.value).filter((x) => picked.includes(x));
    onChange(ordered.length === options.length ? [] : ordered); // everything ticked = All
  };

  const menu = (
    <div
      className={`select__menu ${isSheet ? 'select__menu--sheet' : 'select__menu--left'}`}
      role="listbox" aria-multiselectable="true" aria-label={title}
    >
      {isSheet && (
        <>
          <div className="select__grab" />
          <div className="select__sheet-title">{title}</div>
        </>
      )}
      <div className="select__list">
        <button type="button" role="option" aria-selected={!value.length}
          className={`select__opt${!value.length ? ' is-on' : ''}`} onClick={() => onChange([])}>
          <span className="select__mark is-box">{!value.length && <Check />}</span>
          <span className="select__opt-label">{allLabel}</span>
        </button>
        <div className="select__divider" />
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button key={o.value} type="button" role="option" aria-selected={on}
              className={`select__opt${on ? ' is-on' : ''}`} onClick={() => pick(o.value)}>
              <span className="select__mark is-box">{on && <Check />}</span>
              <span className="select__opt-label">{o.label}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="select__done" onClick={() => setOpen(false)}>Done</button>
    </div>
  );

  return (
    <span className={`pickmenu${open ? ' is-open' : ''}`} ref={rootRef}>
      {renderTrigger({ onClick: () => setOpen((o) => !o), 'aria-haspopup': 'listbox', 'aria-expanded': open })}
      {open && (isSheet
        ? createPortal(
            <div ref={menuRef} className="select__layer">
              <div className="select__backdrop" onClick={() => setOpen(false)} />
              {menu}
            </div>,
            document.body
          )
        : menu)}
    </span>
  );
}