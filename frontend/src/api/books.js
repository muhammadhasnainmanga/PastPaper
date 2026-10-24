import { STREAMS, slug } from '../data/streams.js';
import { toast } from '../components/Toast/Toast.jsx';

// false = fake books made here, true = real calls to your Node.js server
export const BOOKS_SERVER_READY = true;
const API_BASE = '/api';

/*
 ─────────── BACKEND CONTRACT (later) ───────────
 SQL:  books(id, class_level, title, sort_order, storage_key, cover_key, size_bytes, is_active)

 GET /api/books?class=11
   -> { items: [ { id, title, classLevel: 11, size: 18400000, cover: '/api/books/<id>/cover' | null } ] }
 GET /api/books/:id/file      open the PDF in the browser (Content-Disposition: inline)
 GET /api/books/:id/download  save the PDF (Content-Disposition: attachment)
 GET /api/books/:id/cover     the cover image
*/

export async function fetchBooks({ classLevel, signal }) {
  if (BOOKS_SERVER_READY) {
    const res = await fetch(`${API_BASE}/books?class=${classLevel}`, { signal });
    if (!res.ok) throw new Error(`Books request failed (${res.status})`);
    return res.json();
  }
  return mockBooks({ classLevel, signal });
}

export const bookOpenUrl = (id) => `${API_BASE}/books/${id}/file`;
export const bookDownloadUrl = (id) => `${API_BASE}/books/${id}/download`;

// until the server is ready, links show a message instead of opening a dead URL
export function guardBookLink(e) {
  if (BOOKS_SERVER_READY) return;
  e.preventDefault();
  toast('Server not connected yet. Books will open once the backend is ready.');
}

// ───────────────────────── fake data (delete later) ─────────────────────────
function mockBooks({ classLevel, signal }) {
  const names = [...new Set(STREAMS.flatMap((s) => s.subjects[classLevel]))]
    .map((n) => n.replace(/\s*\(optional\)/i, ''));

  const items = names.map((name) => ({
    id: `${classLevel}-${slug(name)}`,
    title: name,
    classLevel,
    size: 3000000 + ((name.length * 733000) % 18000000),
    cover: null,
  }));

  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve({ items }), 350);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}