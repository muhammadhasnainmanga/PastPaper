import { STREAMS, slug } from '../data/streams.js';
import { toast } from '../components/Toast/Toast.jsx';
import { API_BASE } from './config.js';

// false = fake books made here, true = real calls to your Node.js server
export const BOOKS_SERVER_READY = true;

export async function fetchBooks({ classLevel, signal }) {
  if (BOOKS_SERVER_READY) {
    const res = await fetch(`${API_BASE}/books?class=${classLevel}`, { signal });
    if (!res.ok) throw new Error(`Books request failed (${res.status})`);
    const data = await res.json();
    return {
      ...data,
      items: data.items.map((book) => ({
        ...book,
        // The API returns a root-relative path, which would resolve against
        // the Cloudflare frontend host. Resolve it against the Azure API host.
        cover: book.cover ? new URL(book.cover, API_BASE).toString() : null,
      })),
    };
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
