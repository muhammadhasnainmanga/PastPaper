import { useEffect, useState } from 'react';

// KaTeX loads only when a question actually contains a formula, so the rest of the site stays light
let katexPromise;
function loadKatex() {
  if (!katexPromise) {
    katexPromise = Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([m]) => m.default);
  }
  return katexPromise;
}

const MATH = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
const RAW_LATEX = /\\(?:frac|sqrt|hat|bar|vec|text|left|right|sum|prod|int|sin|cos|tan|log|ln|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega|Delta|Gamma|Lambda|Omega|Pi|Sigma|Theta|begin|end)\b|(?:\^|_)\s*(?:\{[^{}]*\}|[A-Za-z0-9])/;

export default function RichText({ text }) {
  const normalized = typeof text === 'string' ? text.replace(/\\\\(?=[A-Za-z])/g, '\\') : text;
  const hasDelimitedMath = typeof normalized === 'string' && normalized.includes('$');
  const hasRawMath = typeof normalized === 'string' && RAW_LATEX.test(normalized);
  const hasMath = hasDelimitedMath || hasRawMath;
  const [katex, setKatex] = useState(null);

  useEffect(() => {
    if (hasMath) loadKatex().then(setKatex);
  }, [hasMath]);

  if (!hasMath) return text;

  if (hasRawMath && !hasDelimitedMath) {
    if (!katex) return <span style={{ visibility: 'hidden' }}>{normalized}</span>;
    try {
      const html = katex.renderToString(normalized, { throwOnError: false });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span>{text}</span>;
    }
  }

  const parts = [];
  let last = 0;
  let m;
  MATH.lastIndex = 0;
  while ((m = MATH.exec(normalized))) {
    if (m.index > last) parts.push({ math: false, v: normalized.slice(last, m.index) });
    parts.push({ math: true, v: (m[1] ?? m[2]).trim(), display: m[1] !== undefined });
    last = MATH.lastIndex;
  }
  if (last < normalized.length) parts.push({ math: false, v: normalized.slice(last) });

  return parts.map((p, i) => {
    if (!p.math) return <span key={i}>{p.v}</span>;
    if (!katex) return <span key={i} style={{ visibility: 'hidden' }}>{p.v}</span>; // no raw LaTeX flash
    let html;
    try {
      html = katex.renderToString(p.v, { throwOnError: false, displayMode: p.display });
    } catch {
      return <span key={i}>{p.v}</span>;
    }
    return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}