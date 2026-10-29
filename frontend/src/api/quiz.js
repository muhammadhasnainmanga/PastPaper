import { STREAMS, YEARS, slug } from '../data/streams.js';

// false = fake quiz data made here, true = real calls to your Node.js server
export const QUIZ_SERVER_READY = false;
const API_BASE = '/api';

/*
 ─────────── BACKEND CONTRACT (later) ───────────
 GET /api/quiz/subjects?class=11
   -> { items: [ { slug: 'physics', name: 'Physics' } ] }          only subjects with a live quiz
 GET /api/quiz/sets?class=11&subject=physics
   -> { items: [ { year: 2025, count: 15 } ] }                      newest year first
 GET /api/quiz/questions?class=11&subject=physics&years=2025,2024   (years missing = all)
   -> { subject: { slug, name },
        items: [ { id, year, number, group: { short, name } | null,
                   body, image: '/api/...' | null, options: ['..'], correct: 1, explanation: '..' | null } ] }
   items are ordered by year (newest first), then by position. Only active sets and questions.
*/

async function get(path, signal) {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) throw new Error(`Quiz request failed (${res.status})`);
  return res.json();
}

export function fetchSubjects({ classLevel, signal }) {
  return QUIZ_SERVER_READY ? get(`/quiz/subjects?class=${classLevel}`, signal) : mock(() => ({ items: subjectsFor(classLevel) }), signal);
}

export function fetchSets({ classLevel, subject, signal }) {
  return QUIZ_SERVER_READY
    ? get(`/quiz/sets?class=${classLevel}&subject=${subject}`, signal)
    : mock(() => ({ items: YEARS.map((year) => ({ year, count: year === YEARS[1] ? 14 : 12 })) }), signal);
}

export function fetchQuestions({ classLevel, subject, years, signal }) {
  if (QUIZ_SERVER_READY) {
    const qs = new URLSearchParams({ class: classLevel, subject });
    if (years.length) qs.set('years', years.join(','));
    return get(`/quiz/questions?${qs}`, signal);
  }
  return mock(() => mockQuestions({ classLevel, subject, years }), signal);
}

// ───────────────────────── fake data (delete later) ─────────────────────────
function mock(make, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(make()), 350);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); });
  });
}

function subjectsFor(classLevel) {
  const names = [...new Set(STREAMS.flatMap((s) => s.subjects[classLevel]))].map((n) => n.replace(/\s*\(optional\)/i, ''));
  return names.map((name) => ({ slug: slug(name), name }));
}

const SCI = { short: 'Sci. Gen.', name: 'Science General' };
const PRE = { short: 'Pre-Med / Pre-Eng', name: 'Pre-Medical & Pre-Engineering' };

function mockQuestions({ classLevel, subject, years }) {
  const sub = subjectsFor(classLevel).find((s) => s.slug === subject);
  if (!sub) return { subject: null, items: [] };
  const wanted = years.length ? years.map(Number) : YEARS;

  const items = YEARS.filter((y) => wanted.includes(y)).flatMap((year) => {
    const twoPapers = year === YEARS[1]; // this year has two papers, to test the group tag
    const count = twoPapers ? 14 : 12;
    return Array.from({ length: count }, (_, k) => {
      const number = twoPapers && k >= 7 ? k - 6 : k + 1;
      return {
        id: `${classLevel}-${subject}-${year}-${k + 1}`,
        year,
        number,
        group: twoPapers ? (k < 7 ? SCI : PRE) : null,
        body: `Sample question ${number} from ${sub.name} ${year}. Which option is correct?`,
        image: null,
        options: ['A', 'B', 'C', 'D'].map((l) => `${sub.name} choice ${l}`),
        correct: (year + k) % 4,
        explanation: k % 2 === 0 ? `Placeholder explanation for question ${number}. Real explanations will come from the database.` : null,
      };
    });
  });
  return { subject: sub, items };
}