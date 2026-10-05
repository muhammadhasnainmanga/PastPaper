import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';

const listeners = new Set();
export function toast(message) { listeners.forEach((fn) => fn(message)); }

export default function Toast() {
  const [msg, setMsg] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    const on = (m) => {
      setMsg(m);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMsg(''), 2800);
    };
    listeners.add(on);
    return () => { listeners.delete(on); clearTimeout(timer.current); };
  }, []);

  // rendered straight into <body>, so it is always fixed to the screen
  return createPortal(
    <div className={`toast${msg ? ' is-on' : ''}`} role="status" aria-live="polite">{msg}</div>,
    document.body
  );
}