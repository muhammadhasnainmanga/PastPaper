import { STREAMS, YEARS, slug } from '../data/streams.js';
import { toast } from '../components/Toast/Toast.jsx';

// ───────────────────────── SERVER SWITCH ─────────────────────────
// false = fake data generated here so you can build the UI.
// true  = real calls to your Node.js server.
export const SERVER_READY = true;
const API_BASE = import.meta.env.VITE_API_URL;  

export async function fetchPapers({ classLevel, streamId, subjects, years, signal, original }) {
  if (SERVER_READY) {
    const qs = new URLSearchParams({ class: classLevel, stream: streamId });
    if (subjects.length) qs.set('subjects', subjects.join(','));
    if (years.length) qs.set('years', years.join(','));
    if (original) qs.set('original', '1');
    const res = await fetch(`${API_BASE}/papers?${qs}`, { signal });
    if (!res.ok) throw new Error(`Papers request failed (${res.status})`);
    return res.json();
  }
  return mockPapers({ classLevel, streamId, subjects, years, signal });
}

export const paperOpenUrl = (id) => `${API_BASE}/papers/${id}/file`;
export const paperDownloadUrl = (id) => `${API_BASE}/papers/${id}/download`;
export const groupDownloadUrl = (ids) =>
  `${API_BASE}/papers/zip?ids=${encodeURIComponent(ids.join(','))}`;

// While the server isn't ready, links show a message instead of opening a dead URL.
export function guardLink(e) {
  if (SERVER_READY) return;
  e.preventDefault();
  toast('Server not connected yet. This will work once the backend is ready.');
}

// ───────────────────────── fake data (delete later) ─────────────────────────
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function mockPapers({ classLevel, streamId, subjects, years, signal }) {
  const stream = STREAMS.find((s) => s.id === streamId);
  const allSubjects = stream ? stream.subjects[Number(classLevel)].map((n) => slug(n)) : [];
  const subs = subjects.length ? subjects : allSubjects;
  const yrs = years.length ? years.map(Number) : YEARS;

  const items = subs.flatMap((subject) =>
    yrs.map((year) => ({
      subject,
      year,
      files: Object.fromEntries(
        ['subjective', 'objective', 'full'].map((type) => {
          const id = `${classLevel}-${subject}-${year}-${type}`;
          return [type, hash(id) % 9 === 0 ? null : { id, size: 400000 + (hash(`${id}-size`) % 3600000) }]; // a few missing, to test "Not available"
        })
      ),
    }))
  );

  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve({ items }), 350);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}