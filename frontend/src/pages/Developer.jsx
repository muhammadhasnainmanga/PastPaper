import { useState } from 'react';
import Reveal from '../components/Reveal/Reveal.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { useCountUp } from '../hooks/useCountUp.js';
import { DEV } from '../data/developer.js';
import './Developer.css';

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9" /></svg>
);

function Photo() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="dphoto">
      {failed
        ? <span className="dphoto__initials">{DEV.initials}</span>
        : <img src={DEV.photo} alt="Developer portrait" decoding="async" onError={() => setFailed(true)} />}
    </div>
  );
}

function Stat({ value, suffix, label, delay }) {
  const [ref, shown] = useReveal({ threshold: 0.4 });
  const n = useCountUp(value, shown);
  return (
    <div ref={ref} className={`dstat glass reveal reveal--up${shown ? ' is-in' : ''}`} style={{ '--d': `${delay}ms` }}>
      <div className="dstat__num">{n}{suffix}</div>
      <div className="dstat__label">{label}</div>
    </div>
  );
}

function SectionHead({ label, title }) {
  return (
    <div className="dsec__head">
      <Reveal as="span" className="pill-label">{label}</Reveal>
      <Reveal as="h2" variant="line" delay={80} className="dsec__title">{title}</Reveal>
    </div>
  );
}

export default function Developer() {
  return (
    <section className="container dev">
      <h1 className="dev__title">
        <Reveal as="span" variant="line">Developer</Reveal>
      </h1>

      <div className="dintro">
        <div className="dintro__text">
          <Reveal as="h2" className="dintro__hello">Hi, I'm {DEV.name}</Reveal>
          {DEV.about.map((p, i) => (
            <Reveal as="p" key={i} delay={120 + i * 100}>{p}</Reveal>
          ))}
        </div>
        <Reveal variant="fade" delay={200} className="dphoto-wrap"><Photo /></Reveal>
      </div>

      <div className="dstats">
        {DEV.stats.map((s, i) => <Stat key={s.label} {...s} delay={i * 100} />)}
      </div>

      <div>
        <SectionHead label="Skills" title="Stack & Skills" />
        <div className="dcards">
          {DEV.stack.map((g, i) => (
            <Reveal as="article" key={g.title} delay={i * 100} className="dcard">
              <h3>{g.title}</h3>
              <div className="dchips">
                {g.items.map((it) => <span key={it} className="dchip">{it}</span>)}
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div>
        <SectionHead label="Profiles" title="Find me online" />
        <div className="dlinks">
          {DEV.profiles.map((p, i) => (
            <Reveal as="a" key={p.name} delay={(i % 5) * 70} className="dlink"
              href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} profile`}>
              <span className="dlink__text">
                <span className="dlink__name">{p.name}</span>
                <span className="dlink__handle">{p.handle}</span>
              </span>
              <span className="dlink__arrow"><Arrow /></span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}