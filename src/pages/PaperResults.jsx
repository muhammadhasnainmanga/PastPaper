import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import Reveal from '../components/Reveal/Reveal.jsx';
import PillRow from '../components/PillRow/PillRow.jsx';
import Segmented from '../components/Segmented/Segmented.jsx';
import PaperGroup from '../components/PaperGroup/PaperGroup.jsx';
import Toast from '../components/Toast/Toast.jsx';
import { EditIcon, ChevronIcon } from '../components/Icons/Icons.jsx';
import { CLASSES, STREAMS, YEARS, PAPER_TYPES, slug } from '../data/streams.js';
import { fetchPapers } from '../api/papers.js';
import './PaperResults.css';

const YEAR_OPTIONS = YEARS.map((y) => ({ value: String(y), label: String(y) }));
const GROUP_OPTIONS = [{ value: 'subject', label: 'Subject' }, { value: 'year', label: 'Year' }];
const SHOW_OPTIONS = PAPER_TYPES.map((t) => ({ value: t.key, label: t.label }));

const PREFS_KEY = 'pastpaper:prefs';
function loadPrefs() {
  const base = { groupBy: 'subject', show: 'full' };
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
    return {
      groupBy: GROUP_OPTIONS.some((o) => o.value === saved.groupBy) ? saved.groupBy : base.groupBy,
      show: SHOW_OPTIONS.some((o) => o.value === saved.show) ? saved.show : base.show,
    };
  } catch { return base; }
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function buildGroups(items, groupBy, subjectOptions) {
  const order = subjectOptions.map((o) => o.value);
  const labelOf = (s) => subjectOptions.find((o) => o.value === s)?.label ?? s;
  const bySubject = (a, b) => order.indexOf(a.subject) - order.indexOf(b.subject);
  const sorted = [...items].sort((a, b) =>
    groupBy === 'subject' ? bySubject(a, b) || b.year - a.year : b.year - a.year || bySubject(a, b)
  );

  const map = new Map();
  sorted.forEach((it) => {
    const key = groupBy === 'subject' ? it.subject : String(it.year);
    if (!map.has(key)) {
      map.set(key, { key, title: groupBy === 'subject' ? labelOf(it.subject) : key, rows: [] });
    }
    map.get(key).rows.push({
      key: `${it.subject}-${it.year}`,
      label: groupBy === 'subject' ? String(it.year) : labelOf(it.subject),
      name: `${labelOf(it.subject)} ${it.year}`,
      files: it.files,
    });
  });

  return [...map.values()].map((g) => ({
    ...g,
    meta: groupBy === 'subject' ? plural(g.rows.length, 'year') : plural(g.rows.length, 'subject'),
  }));
}

function Skeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <div key={i} className="pgroup pgroup--skel" style={{ '--i': i }}>
          <div className="skel skel--title" />
          <div className="skel skel--row" />
          <div className="skel skel--row" />
        </div>
      ))}
    </>
  );
}

export default function PaperResults() {
  const [params, setParams] = useSearchParams();
  const classLevel = params.get('class');
  const stream = STREAMS.find((s) => s.id === params.get('stream'));
  const valid = Boolean(stream && CLASSES.some((c) => String(c.value) === classLevel));

  const subjectOptions = useMemo(
    () => (valid ? stream.subjects[Number(classLevel)].map((n) => ({ value: slug(n), label: n })) : []),
    [valid, stream, classLevel]
  );

  const subjectsRaw = params.get('subjects') || '';
  const yearsRaw = params.get('years') || '';
  const subjectsSel = useMemo(
    () => subjectOptions.map((o) => o.value).filter((v) => subjectsRaw.split(',').includes(v)),
    [subjectOptions, subjectsRaw]
  );
  const yearsSel = useMemo(
    () => YEAR_OPTIONS.map((o) => o.value).filter((v) => yearsRaw.split(',').includes(v)),
    [yearsRaw]
  );

  // the URL is the source of truth, so links are shareable. replace = Back doesn't step through every tweak.
  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, arr]) => {
      if (arr.length) next.set(k, arr.join(','));
      else next.delete(k);
    });
    setParams(next, { replace: true });
  };

  // view preferences, remembered on this device
  const [prefs, setPrefs] = useState(loadPrefs);
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage blocked */ }
  }, [prefs]);

  // keep the finder in sync with what the student last viewed
    useEffect(() => {
    if (!valid) return;
    try {
        localStorage.setItem('pastpaper:last', JSON.stringify({
        class: classLevel, stream: stream.id, subjects: subjectsSel, years: yearsSel,
        }));
    } catch { /* storage blocked, ignore */ }
    }, [valid, classLevel, stream, subjectsSel, yearsSel]);

  // data
  const [state, setState] = useState({ status: 'loading', items: [] });
  const [retry, setRetry] = useState(0);
  const fetchKey = valid ? `${classLevel}|${stream.id}|${subjectsSel.join(',')}|${yearsSel.join(',')}` : '';

  useEffect(() => {
    if (!valid) return undefined;
    const ctrl = new AbortController();
    // keep the old list on screen (dimmed) while the new one loads
    setState((s) => ({ status: s.items.length ? 'refreshing' : 'loading', items: s.items }));
    fetchPapers({ classLevel, streamId: stream.id, subjects: subjectsSel, years: yearsSel, signal: ctrl.signal })
      .then((data) => setState({ status: 'ready', items: data.items }))
      .catch((err) => { if (err.name !== 'AbortError') setState({ status: 'error', items: [] }); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, retry]);

  const subjectCount = subjectsSel.length || subjectOptions.length;
  const yearCount = yearsSel.length || YEAR_OPTIONS.length;
  const total = subjectCount * yearCount;

  // the Group-by switch only makes sense when there are several subjects AND several years
  const showSwitch = subjectCount > 1 && yearCount > 1;
  const groupBy = subjectCount === 1 ? 'subject' : yearCount === 1 ? 'year' : prefs.groupBy;

  const groups = useMemo(() => buildGroups(state.items, groupBy, subjectOptions), [state.items, groupBy, subjectOptions]);

  // collapse / expand
  const [collapsed, setCollapsed] = useState(() => new Set());
  const groupIds = groups.map((g) => `${groupBy}:${g.key}`);
  const allCollapsed = groupIds.length > 0 && groupIds.every((id) => collapsed.has(id));
  const toggleGroup = (id) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setCollapsed((prev) => {
    const next = new Set(prev);
    groupIds.forEach((id) => (allCollapsed ? next.delete(id) : next.add(id)));
    return next;
  });

  if (!valid) return <Navigate to="/papers" replace />;

  return (
    <section className="container results">
      <header className="rhead">
        <Reveal className="rhead__top">
          <span className="pill-label">Class {classLevel}</span>
          <Link to={`/papers?${params.toString()}`} className="rhead__change">
            <EditIcon width={16} height={16} /> Change class or stream
          </Link>
        </Reveal>
        <Reveal as="h1" variant="line" delay={80} className="rhead__title">{stream.name}</Reveal>
        <Reveal as="p" delay={180} className="rhead__sub">
          {plural(total, 'paper')} · {plural(subjectCount, 'subject')} · {plural(yearCount, 'year')}
        </Reveal>
      </header>

      <Reveal className="rfilters glass" delay={260}>
        <PillRow label="Subjects" noun="subject" allLabel="All subjects"
          options={subjectOptions} value={subjectsSel} onChange={(v) => update({ subjects: v })} />
        <PillRow label="Years" noun="year" allLabel="All years"
          options={YEAR_OPTIONS} value={yearsSel} onChange={(v) => update({ years: v })} />
      </Reveal>

      <Reveal className="rcontrols" delay={340}>
        {showSwitch && (
          <div className="rcontrols__item">
            <span className="rcontrols__label">Group by</span>
            <Segmented label="Group by" options={GROUP_OPTIONS} value={groupBy}
              onChange={(v) => setPrefs((p) => ({ ...p, groupBy: v }))} />
          </div>
        )}
        <div className="rcontrols__item">
          <span className="rcontrols__label">Show</span>
          <Segmented label="Paper type" options={SHOW_OPTIONS} value={prefs.show}
            onChange={(v) => setPrefs((p) => ({ ...p, show: v }))} />
        </div>
        {groups.length > 1 && (
          <button type="button" className="rcontrols__toggle" onClick={toggleAll}>
            <ChevronIcon width={16} height={16} style={{ transform: allCollapsed ? 'rotate(-90deg)' : 'rotate(180deg)', transition: 'transform .3s' }} />
            {allCollapsed ? 'Expand all' : 'Collapse all'}
          </button>
        )}
      </Reveal>

      <div className={`rgroups${state.status === 'refreshing' ? ' is-refreshing' : ''}`}>
        {state.status === 'loading' && <Skeleton />}

        {state.status === 'error' && (
          <div className="rmessage glass">
            <h2>Couldn't load papers</h2>
            <p>Check your connection and try again.</p>
            <button type="button" className="btn btn--dark" onClick={() => setRetry((r) => r + 1)}>Try again</button>
          </div>
        )}

        {state.status === 'ready' && groups.length === 0 && (
          <div className="rmessage glass">
            <h2>No papers for this selection</h2>
            <p>Try adding more subjects or years.</p>
            <Link to={`/papers?${params.toString()}`} className="btn btn--dark">Change selection</Link>
          </div>
        )}

        {groups.map((g, i) => {
          const id = `${groupBy}:${g.key}`;
          return (
            <PaperGroup key={id} index={i} title={g.title} meta={g.meta} rows={g.rows}
              show={prefs.show} collapsible={groups.length > 1}
              collapsed={collapsed.has(id)} onToggle={() => toggleGroup(id)} />
          );
        })}
      </div>

      <Toast />
    </section>
  );
}