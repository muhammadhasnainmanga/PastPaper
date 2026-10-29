import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import Dialog from '../components/Dialog/Dialog.jsx';
import QuizResults, { QuestionTags } from './QuizResults.jsx';
import { ArrowIcon } from '../components/StreamsSection/Icons.jsx';
import { CheckIcon, CloseIcon, ChevronIcon } from '../components/Icons/Icons.jsx';
import { fetchQuestions } from '../api/quiz.js';
import { CLASSES } from '../data/streams.js';
import './QuizPlay.css';
import RichText from '../components/RichText/RichText.jsx';

const SLUG = /^[a-z]+(?:-[a-z]+)*$/;
const LETTERS = 'ABCDEF';

export default function QuizPlay() {
  const [params] = useSearchParams();
  const classLevel = params.get('class');
  const subject = params.get('subject') || '';
  const yearsRaw = params.get('years') || '';
  const mode = params.get('mode') === 'exam' ? 'exam' : 'friendly';
  const friendly = mode === 'friendly';
  const valid = CLASSES.some((c) => String(c.value) === classLevel) && SLUG.test(subject);
  const years = useMemo(() => yearsRaw.split(',').filter((y) => /^\d{4}$/.test(y)), [yearsRaw]);
  const key = valid ? `${classLevel}|${subject}|${years.join(',')}|${mode}` : '';
  const storageKey = `pastpaper:quiz:${key}`;

  const [state, setState] = useState({ status: 'loading', items: [], subject: null });
  const [retryFetch, setRetryFetch] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [round, setRound] = useState(0);               // 0 = first attempt, above 0 = retrying missed ones
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});          // question id -> chosen option index
  const [checked, setChecked] = useState({});          // friendly mode: question id -> true
  const [finished, setFinished] = useState(false);
  const [dialog, setDialog] = useState(null);          // 'palette' | 'confirm' | 'resume'
  const savedRef = useRef(null);

  // load the questions
  useEffect(() => {
    if (!valid) return undefined;
    const ctrl = new AbortController();
    setState({ status: 'loading', items: [], subject: null });
    fetchQuestions({ classLevel, subject, years, signal: ctrl.signal })
      .then((d) => setState({ status: 'ready', items: d.items, subject: d.subject }))
      .catch((err) => { if (err.name !== 'AbortError') setState({ status: 'error', items: [], subject: null }); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retryFetch]);

  // fresh start, or offer to resume an unfinished quiz
  useEffect(() => {
    if (state.status !== 'ready') return;
    setQuestions(state.items);
    setRound(0); setIdx(0); setAnswers({}); setChecked({}); setFinished(false); setDialog(null);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && saved.ids === state.items.map((x) => x.id).join(',') && saved.answers && Object.keys(saved.answers).length) {
        savedRef.current = saved;
        setDialog('resume');
      }
    } catch { /* ignore a bad saved value */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // save progress (first attempt only)
  useEffect(() => {
    if (round !== 0 || finished || dialog === 'resume' || !questions.length || !Object.keys(answers).length) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ ids: questions.map((x) => x.id).join(','), idx, answers, checked }));
    } catch { /* storage blocked */ }
  }, [round, finished, dialog, questions, idx, answers, checked, storageKey]);

  const total = questions.length;
  const q = questions[idx];
  const chosen = q ? answers[q.id] : undefined;
  const isChecked = friendly && q && Boolean(checked[q.id]);
  const answeredCount = questions.filter((x) => answers[x.id] !== undefined).length;
  const unanswered = total - answeredCount;
  const last = idx === total - 1;

  const choose = (i) => {
    if (!q || isChecked) return;
    setAnswers((a) => ({ ...a, [q.id]: i }));
  };
  const go = (d) => setIdx((i) => Math.min(Math.max(i + d, 0), total - 1));
  const finish = () => {
    setDialog(null);
    setFinished(true);
    try { localStorage.removeItem(storageKey); } catch { /* storage blocked */ }
  };
  const tryFinish = () => (unanswered ? setDialog('confirm') : finish());

  const needsCheck = friendly && q && !checked[q.id];
  let label;
  let disabled = false;
  if (needsCheck) { label = 'Check answer'; disabled = chosen === undefined; }
  else if (last) label = 'Finish quiz';
  else label = friendly ? 'Next' : chosen !== undefined ? 'Save & next' : 'Skip';

  const primary = () => {
    if (disabled || !q) return;
    if (needsCheck) setChecked((c) => ({ ...c, [q.id]: true }));
    else if (last) tryFinish();
    else go(1);
  };

  const resume = () => {
    const s = savedRef.current;
    setAnswers(s.answers);
    setChecked(s.checked || {});
    setIdx(Math.min(s.idx || 0, questions.length - 1));
    setDialog(null);
  };
  const startOver = () => {
    try { localStorage.removeItem(storageKey); } catch { /* storage blocked */ }
    setDialog(null);
  };
  const retryMissed = () => {
    const missed = questions.filter((x) => answers[x.id] !== x.correct);
    setQuestions(missed); setRound((r) => r + 1); setIdx(0); setAnswers({}); setChecked({}); setFinished(false);
    window.scrollTo(0, 0);
  };

  // keyboard: A-D choose, Enter confirms, arrows move
  const latest = useRef({});
  latest.current = { choose, primary, go, q };
  useEffect(() => {
    if (state.status !== 'ready' || finished || dialog) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { choose: pick, primary: confirm, go: move, q: current } = latest.current;
      if (!current) return;
      const n = LETTERS.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && n > -1 && n < current.options.length) pick(n);
      else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'Enter' && (!document.activeElement || document.activeElement === document.body)) confirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.status, finished, dialog]);

  if (!valid) return <Navigate to="/quiz" replace />;

  if (state.status === 'loading') {
    return (
      <section className="container qplay">
        <div className="qcard glass"><div className="qskel qskel--title" /><div className="qskel" /><div className="qskel" /><div className="qskel" /></div>
      </section>
    );
  }
  if (state.status === 'error') {
    return (
      <section className="container qplay">
        <div className="qmessage glass">
          <h1>Couldn't load the quiz</h1>
          <p>Check your connection and try again.</p>
          <button type="button" className="btn btn--dark" onClick={() => setRetryFetch((r) => r + 1)}>Try again</button>
        </div>
      </section>
    );
  }
  if (!total) {
    return (
      <section className="container qplay">
        <div className="qmessage glass">
          <h1>No questions for this selection</h1>
          <p>Try another subject or year.</p>
          <Link to="/quiz" className="btn btn--dark">Back to quiz setup</Link>
        </div>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="container qplay">
        <QuizResults questions={questions} answers={answers} onRetry={retryMissed}
          subjectName={state.subject?.name} classLevel={classLevel} />
      </section>
    );
  }

  return (
    <section className="container qplay">
      <div className="qtop">
        <Link to="/quiz" className="qexit"><ArrowIcon dir="left" size={16} /> Quiz setup</Link>
        {friendly ? (
          <span className="qcount">Question {idx + 1} of {total}</span>
        ) : (
          <button type="button" className="qcount qcount--btn" onClick={() => setDialog('palette')}>
            Question {idx + 1} of {total} <ChevronIcon width={16} height={16} />
          </button>
        )}
      </div>
      <div className="qbar" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={idx + 1}>
        <div className="qbar__fill" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>
      <p className="qmeta">
        {state.subject?.name} · Class {classLevel} · {friendly ? 'Friendly' : 'Exam'} mode{round > 0 ? ' · Retrying missed questions' : ''}
      </p>

      <article className="qcard glass" key={q.id}>
        <QuestionTags q={q} />
        <h1 className="qbody"><RichText text={q.body} /></h1>
        {q.image && <img className="qimg" src={q.image} alt="" loading="lazy" />}

        <div className="qopts" role="group" aria-label="Answer options">
          {q.options.map((text, i) => {
            const picked = chosen === i;
            const right = isChecked && i === q.correct;
            const wrong = isChecked && picked && i !== q.correct;
            return (
              <button key={i} type="button" disabled={isChecked} aria-pressed={picked}
                className={`qopt${picked ? ' is-picked' : ''}${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}
                onClick={() => choose(i)}>
                <span className="qopt__key">
                  {right ? <CheckIcon width={16} height={16} strokeWidth={3} /> : wrong ? <CloseIcon width={16} height={16} strokeWidth={3} /> : LETTERS[i]}
                </span>
                <span className="qopt__text"><RichText text={text} /></span>
              </button>
            );
          })}
        </div>

        {isChecked && (
          <div className={`qexp${chosen === q.correct ? ' is-right' : ' is-wrong'}`} role="status">
            <strong>{chosen === q.correct ? 'Correct.' : `Not quite. The right answer is ${LETTERS[q.correct]}.`}</strong>
            {q.explanation && <p><RichText text={q.explanation} /></p>}
          </div>
        )}

        <div className="qactions">
          <button type="button" className="qnav" aria-label="Previous question" disabled={idx === 0} onClick={() => go(-1)}>
            <ArrowIcon dir="left" />
          </button>
          <button type="button" className="btn btn--dark" disabled={disabled} onClick={primary}>{label}</button>
          <button type="button" className="qnav" aria-label="Next question" disabled={last} onClick={() => go(1)}>
            <ArrowIcon />
          </button>
        </div>
      </article>

      {dialog === 'palette' && (
        <Dialog title="Jump to a question" onClose={() => setDialog(null)}>
          <div className="qpal">
            {questions.map((x, i) => (
              <button key={x.id} type="button"
                className={`${answers[x.id] !== undefined ? 'is-done' : ''}${i === idx ? ' is-current' : ''}`}
                aria-label={`Question ${i + 1}${answers[x.id] !== undefined ? ', answered' : ''}`}
                onClick={() => { setIdx(i); setDialog(null); }}>{i + 1}</button>
            ))}
          </div>
          <p className="dialog__text">{answeredCount} of {total} answered</p>
          <div className="dialog__actions">
            <button type="button" className="btn btn--glass" onClick={() => setDialog(null)}>Close</button>
            <button type="button" className="btn btn--dark" onClick={tryFinish}>Finish quiz</button>
          </div>
        </Dialog>
      )}

      {dialog === 'confirm' && (
        <Dialog title="Finish quiz?" onClose={() => setDialog(null)}>
          <p className="dialog__text">
            You have {unanswered} unanswered question{unanswered === 1 ? '' : 's'}. They will count as missed.
          </p>
          <div className="dialog__actions">
            <button type="button" className="btn btn--glass" onClick={() => setDialog(null)}>Keep going</button>
            <button type="button" className="btn btn--dark" onClick={finish}>Finish anyway</button>
          </div>
        </Dialog>
      )}

      {dialog === 'resume' && (
        <Dialog title="Resume your quiz?">
          <p className="dialog__text">
            You had answered {Object.keys(savedRef.current?.answers || {}).length} of {total} questions.
          </p>
          <div className="dialog__actions">
            <button type="button" className="btn btn--glass" onClick={startOver}>Start over</button>
            <button type="button" className="btn btn--dark" onClick={resume}>Resume</button>
          </div>
        </Dialog>
      )}
    </section>
  );
}