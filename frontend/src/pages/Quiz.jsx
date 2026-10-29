import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from '../components/Select/Select.jsx';
import { CLASSES } from '../data/streams.js';
import { fetchSubjects, fetchSets } from '../api/quiz.js';
import '../components/PaperFinder/PaperFinder.css';

const CLASS_OPTIONS = CLASSES.map((c) => ({ value: String(c.value), label: c.label }));
const MODE_OPTIONS = [{ value: 'friendly', label: 'Friendly mode' }, { value: 'exam', label: 'Exam mode' }];
const MODE_HINT = {
  friendly: 'Check each answer as you go and see the explanation straight away.',
  exam: 'Answers and explanations are shown only when you finish.',
};
const STORAGE_KEY = 'pastpaper:quiz-last';

const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } };
function fallbackClass() {
  try {
    const c = String(JSON.parse(localStorage.getItem('pastpaper:last') || '{}').class);
    return CLASS_OPTIONS.some((o) => o.value === c) ? c : '';
  } catch { return ''; }
}
const yearsText = (v) => (!v.length ? 'All years' : v.length <= 3 ? v.join(', ') : `${v.length} years`);

export default function Quiz() {
  const navigate = useNavigate();
  const [saved] = useState(load);
  const [classLevel, setClassLevel] = useState(() => (CLASS_OPTIONS.some((o) => o.value === saved.class) ? saved.class : fallbackClass()));
  const [subject, setSubject] = useState(typeof saved.subject === 'string' ? saved.subject : '');
  const [years, setYears] = useState(Array.isArray(saved.years) ? saved.years : []);
  const [mode, setMode] = useState(saved.mode === 'exam' ? 'exam' : 'friendly');
  const [openKey, setOpenKey] = useState(null);

  const [subjects, setSubjects] = useState({ key: '', items: [], failed: false });
  const [sets, setSets] = useState({ key: '', items: [] });

  const ctl = (key) => ({
    open: openKey === key,
    onToggle: (next) => setOpenKey((k) => (next ? key : k === key ? null : k)),
  });

  // subjects that have quizzes for this class
  useEffect(() => {
    if (!classLevel) return undefined;
    const ctrl = new AbortController();
    fetchSubjects({ classLevel, signal: ctrl.signal })
      .then((d) => {
        setSubjects({ key: classLevel, items: d.items, failed: false });
        setSubject((s) => (d.items.some((x) => x.slug === s) ? s : ''));
      })
      .catch((err) => { if (err.name !== 'AbortError') setSubjects({ key: classLevel, items: [], failed: true }); });
    return () => ctrl.abort();
  }, [classLevel]);

  // the years that have a quiz for this subject
  const setsKey = classLevel && subject ? `${classLevel}|${subject}` : '';
  useEffect(() => {
    if (!setsKey) return undefined;
    const ctrl = new AbortController();
    fetchSets({ classLevel, subject, signal: ctrl.signal })
      .then((d) => {
        setSets({ key: setsKey, items: d.items });
        setYears((y) => y.filter((v) => d.items.some((s) => String(s.year) === v)));
      })
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setsKey]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ class: classLevel, subject, years, mode })); } catch { /* storage blocked */ }
  }, [classLevel, subject, years, mode]);

  const subjectOptions = useMemo(
    () => (subjects.key === classLevel ? subjects.items.map((s) => ({ value: s.slug, label: s.name })) : []),
    [subjects, classLevel]
  );
  const setsReady = Boolean(setsKey) && sets.key === setsKey;
  const yearOptions = useMemo(
    () => (setsReady ? sets.items.map((s) => ({ value: String(s.year), label: `${s.year} · ${s.count} questions` })) : []),
    [sets, setsReady]
  );
  const yearPresets = yearOptions.length > 3 ? [{ label: 'Last 3 years', values: yearOptions.slice(0, 3).map((o) => o.value) }] : [];

  const total = setsReady
    ? sets.items.filter((s) => !years.length || years.includes(String(s.year))).reduce((n, s) => n + s.count, 0)
    : 0;
  const ready = Boolean(classLevel && subject && setsReady && total > 0);
  const subjectName = subjectOptions.find((o) => o.value === subject)?.label;

  const onClass = (v) => {
    setClassLevel(v);
    setSubject('');
    setYears([]);
    setOpenKey('subject'); // guide the student to the next step
  };
  const onSubject = (v) => { setSubject(v); setYears([]); };

  const start = () => {
    if (!ready) return;
    const qs = new URLSearchParams({ class: classLevel, subject, mode });
    if (years.length) qs.set('years', years.join(','));
    navigate(`/quiz/play?${qs.toString()}`);
  };

  const subjectDisabledText = !classLevel ? 'Pick a class first'
    : subjects.failed ? "Couldn't load subjects"
    : subjects.key !== classLevel ? 'Loading subjects…' : 'No quizzes yet';

  return (
    <section className="container finder-page">
      <div className="finder-reveal">
        <div className="finder">
          <div className="finder__card glass">
            <h1 className="finder__title">Quiz.</h1>
            <p className="finder__sub">Practice objective questions from past papers.</p>

            <div className="finder__grid">
              <Select label="Class" placeholder="Select class" options={CLASS_OPTIONS}
                value={classLevel} onChange={onClass} {...ctl('class')} />
              <Select label="Subject" placeholder="Select subject" options={subjectOptions}
                value={subject} onChange={onSubject} align="right"
                disabled={!subjectOptions.length} disabledText={subjectDisabledText} {...ctl('subject')} />
              <Select label="Quiz" multiple allLabel="All years" options={yearOptions} presets={yearPresets}
                value={years} onChange={setYears} summarize={yearsText}
                disabled={!setsReady || !yearOptions.length}
                disabledText={!subject ? 'Pick a subject first' : 'Loading quizzes…'} {...ctl('years')} />
              <Select label="Mode" options={MODE_OPTIONS} value={mode} onChange={setMode} align="right" {...ctl('mode')} />
            </div>

            <p className="finder__summary">
              {ready ? (
                <><strong>Class {classLevel}</strong> · {subjectName} · {yearsText(years)} · {mode === 'exam' ? 'Exam' : 'Friendly'} mode</>
              ) : (
                'Choose your class and subject to see the available quizzes.'
              )}
            </p>
            <p className="finder__summary">{MODE_HINT[mode]}</p>
          </div>

          <div className="finder__action">
            <button type="button" className="btn btn--dark" disabled={!ready} onClick={start}>
              {ready ? `Start quiz · ${total} questions →` : 'Select class and subject'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}