import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Dialog.css';

// rendered into <body>, so it always sits over the whole screen. Leave out onClose to force a choice.
export default function Dialog({ title, onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return createPortal(
    <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog__backdrop" onClick={onClose} />
      <div className="dialog__card">
        <h2 className="dialog__title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
}