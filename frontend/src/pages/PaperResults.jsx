import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import Reveal from "../components/Reveal/Reveal.jsx";
import PillRow from "../components/PillRow/PillRow.jsx";
import Segmented from "../components/Segmented/Segmented.jsx";
import PaperGroup from "../components/PaperGroup/PaperGroup.jsx";
import Toast from "../components/Toast/Toast.jsx";
import { EditIcon, ChevronIcon } from "../components/Icons/Icons.jsx";
import { CLASSES, STREAMS, YEARS, PAPER_TYPES, slug } from "../data/streams.js";
import { fetchPapers } from "../api/papers.js";
import "./PaperResults.css";
import Switch from "../components/Switch/Switch.jsx";
import { useSeo } from "../hooks/useSeo.js";

const YEAR_OPTIONS = YEARS.map((y) => ({ value: String(y), label: String(y) }));

const SHOW_OPTIONS = PAPER_TYPES.map((t) => ({ value: t.key, label: t.label }));

const PREFS_KEY = "pastpaper:prefs";

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
    return {
      show: SHOW_OPTIONS.some((o) => o.value === saved.show)
        ? saved.show
        : "full",
    };
  } catch {
    return { show: "full" };
  }
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function buildGroups(items, groupBy, subjectOptions) {
  const order = subjectOptions.map((o) => o.value);
  const labelOf = (s) => subjectOptions.find((o) => o.value === s)?.label ?? s;
  const bySubject = (a, b) =>
    order.indexOf(a.subject) - order.indexOf(b.subject);
  const sorted = [...items].sort((a, b) =>
    groupBy === "subject"
      ? bySubject(a, b) || b.year - a.year
      : b.year - a.year || bySubject(a, b),
  ); // stable sort: papers of the same subject-year keep the server's group order

  const map = new Map();
  sorted.forEach((it) => {
    const key = groupBy === "subject" ? it.subject : String(it.year);
    if (!map.has(key)) {
      map.set(key, {
        key,
        title: groupBy === "subject" ? labelOf(it.subject) : key,
        rows: [],
        units: new Set(),
      });
    }
    const g = map.get(key);
    g.units.add(groupBy === "subject" ? it.year : it.subject);
    g.rows.push({
      key: `${it.subject}-${it.year}-${it.group?.slug || "all"}`,
      label: groupBy === "subject" ? String(it.year) : labelOf(it.subject),
      name: `${labelOf(it.subject)} ${it.year}${it.group ? ` (${it.group.short})` : ""}`,
      files: it.files,
      group: it.group || null,
    });
  });

  return [...map.values()].map((g) => ({
    key: g.key,
    title: g.title,
    rows: g.rows,
    meta:
      groupBy === "subject"
        ? plural(g.units.size, "year")
        : plural(g.units.size, "subject"),
  }));
}

function Skeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <div key={i} className="pgroup pgroup--skel" style={{ "--i": i }}>
          <div className="skel skel--title" />
          <div className="skel skel--row" />
          <div className="skel skel--row" />
        </div>
      ))}
    </>
  );
}

export default function PaperResults() {
  useSeo({
    title: "Past papers | PastPaper",
    description: "Past papers for your selection.",
    path: "/papers",
    noindex: true,
  });

  const [params, setParams] = useSearchParams();
  const classLevel = params.get("class");
  const stream = STREAMS.find((s) => s.id === params.get("stream"));
  const valid = Boolean(
    stream && CLASSES.some((c) => String(c.value) === classLevel),
  );
  const original = params.get("original") === "1";

  const subjectOptions = useMemo(
    () =>
      valid
        ? stream.subjects[Number(classLevel)].map((n) => ({
            value: slug(n),
            label: n,
          }))
        : [],
    [valid, stream, classLevel],
  );

  const subjectParam =
    params.get("subject") || (params.get("subjects") || "").split(",")[0];
  const subject = subjectOptions.find((o) => o.value === subjectParam) || null;
  const ok = valid && Boolean(subject); // class, stream and subject are all good

  const yearsRaw = params.get("years") || "";
  const yearsSel = useMemo(
    () =>
      YEAR_OPTIONS.map((o) => o.value).filter((v) =>
        yearsRaw.split(",").includes(v),
      ),
    [yearsRaw],
  );

  // the URL is the source of truth, so links are shareable. replace = Back doesn't step through every tweak.
  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, arr]) => {
      if (arr.length) next.set(k, arr.join(","));
      else next.delete(k);
    });
    setParams(next, { replace: true });
  };

  // view preferences, remembered on this device
  const [prefs, setPrefs] = useState(loadPrefs);
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* storage blocked */
    }
  }, [prefs]);

  // keep the finder in sync with what the student last viewed
  useEffect(() => {
    if (!ok) return;
    try {
      localStorage.setItem(
        "pastpaper:last",
        JSON.stringify({
          class: classLevel,
          stream: stream.id,
          subject: subject.value,
          years: yearsSel,
        }),
      );
    } catch {
      /* storage blocked, ignore */
    }
  }, [ok, classLevel, stream, subject, yearsSel]);

  // data
  const [state, setState] = useState({ status: "loading", items: [] });
  const [retry, setRetry] = useState(0);
  const fetchKey = ok ? `${classLevel}|${stream.id}|${subject.value}|${yearsSel.join(',')}|${original ? 1 : 0}` : '';;

  useEffect(() => {
    if (!ok) return undefined;
    const ctrl = new AbortController();
    // keep the old list on screen (dimmed) while the new one loads
    setState((s) => ({
      status: s.items.length ? "refreshing" : "loading",
      items: s.items,
    }));
    fetchPapers({
      classLevel,
      streamId: stream.id,
      subjects: [subject.value],
      years: yearsSel,
      signal: ctrl.signal,
      original,
    })
      .then((data) => setState({ status: "ready", items: data.items }))
      .catch((err) => {
        if (err.name !== "AbortError") setState({ status: "error", items: [] });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, retry]);

  const yearCount = yearsSel.length || YEAR_OPTIONS.length;
  const total = state.status === 'ready' ? state.items.length : yearCount;
  const groupBy = 'subject';   // one subject per page, so the rows are always its years

  const groups = useMemo(
    () => buildGroups(state.items, groupBy, subjectOptions),
    [state.items, groupBy, subjectOptions],
  );

  // collapse / expand
  const [collapsed, setCollapsed] = useState(() => new Set());
  const groupIds = groups.map((g) => `${groupBy}:${g.key}`);
  const toggleGroup = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // with one group left there is nothing to collapse, so forget any old collapsed state
  useEffect(() => {
    if (groups.length <= 1) setCollapsed(new Set());
  }, [groups.length]);

    if (!ok) return <Navigate to={valid ? `/papers?${params.toString()}` : '/papers'} replace />;

  return (
    <section className="container results">
      <header className="rhead">
      <Reveal className="rhead__top">
        <span className="pill-label">Class {classLevel} · {stream.name}</span>
        <Link to={`/papers?${params.toString()}`} className="rhead__change">
          <EditIcon width={16} height={16} /> Change class or stream
        </Link>
      </Reveal>
      <Reveal as="h1" variant="line" delay={80} className="rhead__title">{subject.label}</Reveal>
      <Reveal as="p" delay={180} className="rhead__sub">
        {plural(total, 'paper')} · {plural(yearCount, 'year')}
      </Reveal>
    </header>

    <Reveal className="rfilters glass" delay={260}>
      <div className="pillrow">
        <span className="pillrow__label">Subject</span>
        <div className="pillrow__pills">
          <Segmented label="Subject" options={subjectOptions} value={subject.value}
            onChange={(v) => update({ subject: [v], subjects: [] })} />
        </div>
      </div>
      <PillRow label="Years" noun="year" allLabel="All years"
        options={YEAR_OPTIONS} value={yearsSel} onChange={(v) => update({ years: v })} />
    </Reveal>

      <Reveal className="rcontrols" delay={340}>
        <div className="rcontrols__item">
          <span className="rcontrols__label">Show</span>
          <Segmented
            label="Paper type"
            options={SHOW_OPTIONS}
            value={prefs.show}
            onChange={(v) => setPrefs((p) => ({ ...p, show: v }))}
          />
        </div>
        <div className="rcontrols__item">
          <Switch
            label="Original"
            checked={original}
            onChange={(v) => update({ original: v ? ["1"] : [] })}
            hint="Show the original, unedited PDFs instead of the scanned ones"
          />
        </div>
      </Reveal>
      {state.status === "ready" &&
        original &&
        state.items.every((it) => Object.values(it.files).every((f) => !f)) && (
          <p className="rnote">
            No original PDFs for this selection yet. Switch Original off to see
            the scanned ones.
          </p>
        )}
      <div
        className={`rgroups${state.status === "refreshing" ? " is-refreshing" : ""}`}
      >
        {state.status === "loading" && <Skeleton />}

        {state.status === "error" && (
          <div className="rmessage glass">
            <h2>Couldn't load papers</h2>
            <p>Check your connection and try again.</p>
            <button
              type="button"
              className="btn btn--dark"
              onClick={() => setRetry((r) => r + 1)}
            >
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && groups.length === 0 && (
          <div className="rmessage glass">
            <h2>No papers for this selection</h2>
            <p>Try adding more subjects or years.</p>
            <Link to={`/papers?${params.toString()}`} className="btn btn--dark">
              Change selection
            </Link>
          </div>
        )}

        {groups.map((g, i) => {
          const id = `${groupBy}:${g.key}`;
          return (
            <PaperGroup
              key={id}
              index={i}
              title={g.title}
              meta={g.meta}
              rows={g.rows}
              show={prefs.show}
              collapsible={groups.length > 1}
              collapsed={groups.length > 1 && collapsed.has(id)}
              onToggle={() => toggleGroup(id)}
            />
          );
        })}
      </div>

      <Toast />
    </section>
  );
}
