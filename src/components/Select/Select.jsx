import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Select.css';

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

// true on phones: menus open as a bottom sheet instead of a dropdown
const SHEET_QUERY = '(max-width: 640px)';
function useIsSheet() {
  const [isSheet, setIsSheet] = useState(() => window.matchMedia(SHEET_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(SHEET_QUERY);
    const on = () => setIsSheet(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return isSheet;
}

// Custom dropdown. Single select returns a string, multiple returns an array
// (an empty array means "All").
export default function Select({
  label, options, value, onChange,
  multiple = false, allLabel, presets = [],
  placeholder = 'Select', disabled = false, disabledText,
  summarize, align = 'left',
  open, onToggle,
}) {
  const rootRef = useRef(null);
  const menuRef = useRef(null);   // only used for the portal'd sheet
  const isSheet = useIsSheet();

  // close on outside click or Escape
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      onToggle(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') onToggle(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onToggle]);

  // stop the page behind the sheet from scrolling
  useEffect(() => {
    if (!open || !isSheet) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open, isSheet]);

  const labelOf = (v) => options.find((o) => o.value === v)?.label;
  const isOn = (v) => (multiple ? value.includes(v) : value === v);

  const pick = (v) => {
    if (!multiple) { onToggle(false); onChange(v); return; }
    const picked = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    const ordered = options.map((o) => o.value).filter((x) => picked.includes(x));
    onChange(ordered.length === options.length ? [] : ordered); // everything ticked = All
  };

  let text;
  if (disabled && disabledText) text = disabledText;
  else if (summarize) text = summarize(value);
  else if (multiple) {
    if (!value.length) text = allLabel || placeholder;
    else if (value.length === 1) text = labelOf(value[0]);
    else text = `${labelOf(value[0])} +${value.length - 1}`;
  } else text = labelOf(value) || placeholder;

  const muted = disabled || (!multiple && !labelOf(value));

  const menu = (
    <div
      className={`select__menu ${isSheet ? 'select__menu--sheet' : `select__menu--${align}`}`}
      role="listbox"
      aria-multiselectable={multiple}
    >
      {isSheet && (
        <>
          <div className="select__grab" />
          <div className="select__sheet-title">{label}</div>
        </>
      )}

      <div className="select__list">
        {multiple && allLabel && (
          <button type="button" role="option" aria-selected={!value.length}
            className={`select__opt${!value.length ? ' is-on' : ''}`} onClick={() => onChange([])}>
            <span className="select__mark is-box">{!value.length && <Check />}</span>
            <span className="select__opt-label">{allLabel}</span>
          </button>
        )}

        {presets.map((p) => {
          const on = sameSet(value, p.values);
          return (
            <button key={p.label} type="button" role="option" aria-selected={on}
              className={`select__opt${on ? ' is-on' : ''}`}
              onClick={() => { onChange(p.values); onToggle(false); }}>
              <span className="select__mark is-box">{on && <Check />}</span>
              <span className="select__opt-label">{p.label}</span>
            </button>
          );
        })}

        {(presets.length > 0 || (multiple && allLabel)) && <div className="select__divider" />}

        {options.map((o) => {
          const on = isOn(o.value);
          return (
            <button key={o.value} type="button" role="option" aria-selected={on}
              className={`select__opt${on ? ' is-on' : ''}`} onClick={() => pick(o.value)}>
              <span className={`select__mark${multiple ? ' is-box' : ''}`}>{on && <Check />}</span>
              <span className="select__opt-label">{o.label}</span>
            </button>
          );
        })}
      </div>

      {multiple && (
        <button type="button" className="select__done" onClick={() => onToggle(false)}>Done</button>
      )}
    </div>
  );

  return (
    <div className={`select${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`} ref={rootRef}>
      <span className="select__label">{label}</span>

      <button
        type="button"
        className={`select__trigger${muted ? ' is-muted' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => onToggle(!open)}
      >
        <span className="select__text">{text}</span>
        <svg className="select__chev" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (isSheet
        ? createPortal(
            <div ref={menuRef} className="select__layer">
              <div className="select__backdrop" onClick={() => onToggle(false)} />
              {menu}
            </div>,
            document.body
          )
        : menu)}
    </div>
  );
}