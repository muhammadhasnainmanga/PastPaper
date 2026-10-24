import { useEffect, useState } from 'react';
import Reveal from '../components/Reveal/Reveal.jsx';
import ClassToggle from '../components/ClassToggle/ClassToggle.jsx';
import BookCard from '../components/BookCard/BookCard.jsx';
import Toast from '../components/Toast/Toast.jsx';
import { fetchBooks } from '../api/books.js';
import './Books.css';

const CLASS_KEY = 'pastpaper:books-class';

// remembered class, otherwise the class they last used on the papers page
function startClass() {
  try {
    const saved = localStorage.getItem(CLASS_KEY) || JSON.parse(localStorage.getItem('pastpaper:last') || '{}').class;
    return String(saved) === '12' ? 12 : 11;
  } catch { return 11; }
}

function Skeleton() {
  return Array.from({ length: 6 }, (_, i) => (
    <div key={i} className="bskel">
      <div className="bskel__plate" />
      <div className="bskel__line" />
      <div className="bskel__btn" />
    </div>
  ));
}

export default function Books() {
  const [classLevel, setClassLevel] = useState(startClass);
  const [state, setState] = useState({ status: 'loading', items: [] });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(CLASS_KEY, String(classLevel)); } catch { /* storage blocked */ }
  }, [classLevel]);

  useEffect(() => {
    const ctrl = new AbortController();
    // keep the old books on screen (dimmed) while the new ones load
    setState((s) => ({ status: s.items.length ? 'refreshing' : 'loading', items: s.items }));
    fetchBooks({ classLevel, signal: ctrl.signal })
      .then((data) => setState({ status: 'ready', items: data.items }))
      .catch((err) => { if (err.name !== 'AbortError') setState({ status: 'error', items: [] }); });
    return () => ctrl.abort();
  }, [classLevel, retry]);

  return (
    <section className="container books">
      <header className="bhead">
        <Reveal as="p" className="bhead__eyebrow">Sindh Board</Reveal>
        <h1 className="bhead__title">
          <Reveal as="span" variant="line" delay={80}>Class 11 and Class 12</Reveal>
          <Reveal as="span" variant="line" delay={160}>Books</Reveal>
        </h1>
        <Reveal as="p" delay={260} className="bhead__sub">Downloadable Free PDFs</Reveal>
        <Reveal delay={340}><ClassToggle value={classLevel} onChange={setClassLevel} /></Reveal>
      </header>

      {state.status === 'loading' && <div className="bgrid"><Skeleton /></div>}

      {state.status === 'error' && (
        <div className="bmessage glass">
          <h2>Couldn't load books</h2>
          <p>Check your connection and try again.</p>
          <button type="button" className="btn btn--dark" onClick={() => setRetry((r) => r + 1)}>Try again</button>
        </div>
      )}

      {state.status === 'ready' && state.items.length === 0 && (
        <div className="bmessage glass">
          <h2>No books yet for Class {classLevel}</h2>
          <p>They will be added soon.</p>
        </div>
      )}

      {(state.status === 'ready' || state.status === 'refreshing') && state.items.length > 0 && (
        <div className={`bgrid${state.status === 'refreshing' ? ' is-refreshing' : ''}`}>
          {state.items.map((book, i) => (
            <Reveal key={book.id} delay={(i % 3) * 90}>
              <BookCard book={book} />
            </Reveal>
          ))}
        </div>
      )}

      <Toast />
    </section>
  );
}