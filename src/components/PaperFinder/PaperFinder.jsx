import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from '../Select/Select.jsx';
import { CLASSES, STREAMS, YEARS, slug } from '../../data/streams.js';
import './PaperFinder.css';

const CLASS_OPTIONS = CLASSES.map((c) => ({ value: String(c.value), label: c.label }));
const STREAM_OPTIONS = STREAMS.map((s) => ({ value: s.id, label: s.name }));
const YEAR_OPTIONS = YEARS.map((y) => ({ value: String(y), label: String(y) }));
const YEAR_PRESETS = [{ label: 'Last 3 years', values: YEAR_OPTIONS.slice(0, 3).map((o) => o.value) }];
const STORAGE_KEY = 'pastpaper:last';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

// 2026 – 2024 for a run of years, otherwise a short list
function yearsLabel(values) {
  if (!values.length) return 'All years';
  if (values.length === 1) return values[0];
  const idx = values.map((v) => YEARS.indexOf(Number(v))).sort((a, b) => a - b);
  const run = idx.every((n, i) => i === 0 || n === idx[i - 1] + 1);
  if (run) return `${YEARS[idx[0]]} – ${YEARS[idx[idx.length - 1]]}`;
  return values.length === 2 ? values.join(', ') : `${values.length} years`;
}

export default function PaperFinder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Coming from Home? Class and stream arrive pre-selected in the URL.
  const [saved] = useState(loadSaved);

// A link from Home wins. If there is none, use what the student picked last time.
   const [classLevel, setClassLevel] = useState(() => {
   const fromUrl = params.get('class');
   if (CLASS_OPTIONS.some((o) => o.value === fromUrl)) return fromUrl;
   return CLASS_OPTIONS.some((o) => o.value === saved.class) ? saved.class : '';
   });
   const [streamId, setStreamId] = useState(() => {
   const fromUrl = params.get('stream');
   if (STREAMS.some((s) => s.id === fromUrl)) return fromUrl;
   return STREAMS.some((s) => s.id === saved.stream) ? saved.stream : '';
   });
   const isYear = (y) => YEAR_OPTIONS.some((o) => o.value === y);

    const [subjects, setSubjects] = useState(() => {
    const fromUrl = (params.get('subjects') || '').split(',').filter(Boolean);
    if (fromUrl.length) return fromUrl;
    // saved subjects only make sense for the same class and stream
    const sameGroup = saved.class === classLevel && saved.stream === streamId;
    return sameGroup && Array.isArray(saved.subjects) ? saved.subjects : [];
    });

    const [years, setYears] = useState(() => {
    const fromUrl = (params.get('years') || '').split(',').filter(isYear);
    if (fromUrl.length) return fromUrl;
    return Array.isArray(saved.years) ? saved.years.filter(isYear) : [];
    });
   const [openKey, setOpenKey] = useState(null);

    const ctl = (key) => ({
    open: openKey === key,
    onToggle: (next) => setOpenKey((k) => (next ? key : k === key ? null : k)),
  });

  useEffect(() => {
  if (!classLevel && !streamId) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      class: classLevel, stream: streamId, subjects, years,
    }));
  } catch { /* storage blocked, ignore */ }
    }, [classLevel, streamId, subjects, years]);

  const stream = STREAMS.find((s) => s.id === streamId);
  const ready = Boolean(classLevel && stream);

  const subjectOptions = useMemo(
    () => (ready ? stream.subjects[Number(classLevel)].map((n) => ({ value: slug(n), label: n })) : []),
    [ready, stream, classLevel]
  );
  const validSubjects = subjects.filter((s) => subjectOptions.some((o) => o.value === s));

  const subjectCount = validSubjects.length || subjectOptions.length;
  const yearCount = years.length || YEARS.length;
  const total = subjectCount * yearCount;

  const subjectText = !validSubjects.length
    ? 'All subjects'
    : validSubjects.length === 1
      ? subjectOptions.find((o) => o.value === validSubjects[0]).label
      : `${validSubjects.length} subjects`;

  const onClass = (v) => {
    setClassLevel(v);
    setSubjects([]);                       // subject list changes with the class
    if (!streamId) setOpenKey('stream');   // guide the student to the next step
  };
  const onStream = (v) => { setStreamId(v); setSubjects([]); };

  const submit = () => {
    if (!ready) return;
    const qs = new URLSearchParams({ class: classLevel, stream: streamId });
    if (validSubjects.length) qs.set('subjects', validSubjects.join(','));
    if (years.length) qs.set('years', years.join(','));
    navigate(`/papers/results?${qs.toString()}`);
  };

  return (
    <div className="finder">
      <div className="finder__card glass">
        <h1 className="finder__title">Past Papers</h1>
        <p className="finder__sub">Pick what you need. Subjects and years start on All.</p>

        <div className="finder__grid">
          <Select label="Class" placeholder="Select class" options={CLASS_OPTIONS}
            value={classLevel} onChange={onClass} {...ctl('class')} />
          <Select label="Stream" placeholder="Select stream" options={STREAM_OPTIONS}
            value={streamId} onChange={onStream} align="right" {...ctl('stream')} />
          <Select label="Subject" multiple allLabel="All subjects" options={subjectOptions}
            value={validSubjects} onChange={setSubjects}
            disabled={!ready} disabledText="Pick class and stream first" {...ctl('subjects')} />
          <Select label="Years" multiple allLabel="All years" options={YEAR_OPTIONS} presets={YEAR_PRESETS}
            value={years} onChange={setYears} summarize={yearsLabel} align="right"
            disabled={!ready} disabledText="Pick class and stream first" {...ctl('years')} />
        </div>

        <p className="finder__summary">
          {ready ? (
            <>
              <strong>Class {classLevel}</strong> · {stream.name} · {subjectText} · {yearsLabel(years)}
            </>
          ) : (
            'Choose your class and stream to unlock subjects and years.'
          )}
        </p>
      </div>

      <div className="finder__action">
        <button type="button" className="btn btn--dark" disabled={!ready} onClick={submit}>
          {ready ? `View ${total} ${total === 1 ? 'paper' : 'papers'} →` : 'Select class and stream'}
        </button>
      </div>
    </div>
  );
}