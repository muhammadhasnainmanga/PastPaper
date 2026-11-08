import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "../Select/Select.jsx";
import { CLASSES, STREAMS, YEARS, slug } from "../../data/streams.js";
import "./PaperFinder.css";

const CLASS_OPTIONS = CLASSES.map((c) => ({
  value: String(c.value),
  label: c.label,
}));
const STREAM_OPTIONS = STREAMS.map((s) => ({ value: s.id, label: s.name }));
const YEAR_OPTIONS = YEARS.map((y) => ({ value: String(y), label: String(y) }));
const YEAR_PRESETS = [
  {
    label: "Last 3 years",
    values: YEAR_OPTIONS.slice(0, 3).map((o) => o.value),
  },
];

const STORAGE_KEY = "pastpaper:last";
function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

// 2026 – 2024 for a run of years, otherwise a short list
function yearsLabel(values) {
  if (!values.length) return "All years";
  if (values.length === 1) return values[0];
  const idx = values.map((v) => YEARS.indexOf(Number(v))).sort((a, b) => a - b);
  const run = idx.every((n, i) => i === 0 || n === idx[i - 1] + 1);
  if (run) return `${YEARS[idx[0]]} – ${YEARS[idx[idx.length - 1]]}`;
  return values.length === 2 ? values.join(", ") : `${values.length} years`;
}

export default function PaperFinder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [saved] = useState(loadSaved);

  // A link from Home wins. If there is none, use what the student picked last time.
  const [classLevel, setClassLevel] = useState(() => {
    const fromUrl = params.get("class");
    if (CLASS_OPTIONS.some((o) => o.value === fromUrl)) return fromUrl;
    return CLASS_OPTIONS.some((o) => o.value === saved.class)
      ? saved.class
      : "";
  });
  const [streamId, setStreamId] = useState(() => {
    const fromUrl = params.get("stream");
    if (STREAMS.some((s) => s.id === fromUrl)) return fromUrl;
    return STREAMS.some((s) => s.id === saved.stream) ? saved.stream : "";
  });
  const [subject, setSubject] = useState(() => {
    const fromUrl =
      params.get("subject") || (params.get("subjects") || "").split(",")[0];
    if (fromUrl) return fromUrl;
    // a saved subject only makes sense for the same class and stream
    const sameGroup = saved.class === classLevel && saved.stream === streamId;
    return sameGroup && typeof saved.subject === "string" ? saved.subject : "";
  });
  const [years, setYears] = useState(() => {
    const fromUrl = (params.get("years") || "")
      .split(",")
      .filter((y) => YEAR_OPTIONS.some((o) => o.value === y));
    if (fromUrl.length) return fromUrl;
    return Array.isArray(saved.years)
      ? saved.years.filter((y) => YEAR_OPTIONS.some((o) => o.value === y))
      : [];
  });
  const [openKey, setOpenKey] = useState(null);

  const ctl = (key) => ({
    open: openKey === key,
    onToggle: (next) => setOpenKey((k) => (next ? key : k === key ? null : k)),
  });

  const stream = STREAMS.find((s) => s.id === streamId);
  const ready = Boolean(classLevel && stream);

  const subjectOptions = useMemo(
    () =>
      ready
        ? stream.subjects[Number(classLevel)].map((n) => ({
            value: slug(n),
            label: n,
          }))
        : [],
    [ready, stream, classLevel],
  );
  const validSubject = subjectOptions.some((o) => o.value === subject)
    ? subject
    : "";
  const subjectLabel =
    subjectOptions.find((o) => o.value === validSubject)?.label || "";
  const canView = ready && Boolean(validSubject);

  useEffect(() => {
    if (!classLevel && !streamId) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          class: classLevel,
          stream: streamId,
          subject: validSubject,
          years,
        }),
      );
    } catch {
      /* storage blocked, ignore */
    }
  }, [classLevel, streamId, validSubject, years]);

  const onClass = (v) => {
    setClassLevel(v);
    setSubject(""); // the subject list changes with the class
    setOpenKey(streamId ? "subject" : "stream"); // guide the student to the next step
  };
  const onStream = (v) => {
    setStreamId(v);
    setSubject("");
    if (classLevel) setOpenKey("subject");
  };

  const submit = () => {
    if (!canView) return;
    const qs = new URLSearchParams({
      class: classLevel,
      stream: streamId,
      subject: validSubject,
    });
    if (years.length) qs.set("years", years.join(","));
    navigate(`/papers/results?${qs.toString()}`);
  };

  return (
    <div className="finder">
      <div className="finder__card glass">
        <h1 className="finder__title">Past Papers</h1>
        <p className="finder__sub">Pick a subject. Years start on All.</p>

        <div className="finder__grid">
          <Select
            label="Class"
            placeholder="Select class"
            options={CLASS_OPTIONS}
            value={classLevel}
            onChange={onClass}
            {...ctl("class")}
          />
          <Select
            label="Stream"
            placeholder="Select stream"
            options={STREAM_OPTIONS}
            value={streamId}
            onChange={onStream}
            align="right"
            {...ctl("stream")}
          />
          <Select
            label="Subject"
            placeholder="Select subject"
            options={subjectOptions}
            value={validSubject}
            onChange={setSubject}
            disabled={!ready}
            disabledText="Pick class and stream first"
            {...ctl("subject")}
          />
          <Select
            label="Years"
            multiple
            allLabel="All years"
            options={YEAR_OPTIONS}
            presets={YEAR_PRESETS}
            value={years}
            onChange={setYears}
            summarize={yearsLabel}
            align="right"
            disabled={!ready}
            disabledText="Pick class and stream first"
            {...ctl("years")}
          />
        </div>

        <p className="finder__summary">
          {ready ? (
            <>
              <strong>Class {classLevel}</strong> · {stream.name} ·{" "}
              {subjectLabel || "Select a subject"} · {yearsLabel(years)}
            </>
          ) : (
            "Choose your class and stream to unlock subjects and years."
          )}
        </p>
      </div>

      <div className="finder__action">
        <button
          type="button"
          className="btn btn--dark"
          disabled={!canView}
          onClick={submit}
        >
          {canView
            ? `View ${subjectLabel} papers →`
            : ready
              ? "Select a subject"
              : "Select class and stream"}
        </button>
      </div>
    </div>
  );
}
