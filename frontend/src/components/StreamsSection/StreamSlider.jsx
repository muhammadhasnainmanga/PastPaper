import { useRef, useState } from 'react';
import StreamCard from './StreamCard.jsx';
import { ArrowIcon } from './Icons.jsx';
import { useReveal } from '../../hooks/useReveal.js';
import '../Reveal/Reveal.css';
const SWIPE_PX = 45;

export default function StreamSlider({ streams, classLevel }) {
  const [index, setIndex] = useState(0);
  const [revealRef, shown] = useReveal();
  const [wrapIdx, setWrapIdx] = useState(null);
  const wrapTimer = useRef(null); 
  const total = streams.length;
  const pointer = useRef({ x: 0, down: false, moved: false });

  const goTo = (next) => {
  if (next === index) return;
  const step = (next - index + total) % total === 1 ? 1 : -1;
  setWrapIdx((index - step + total) % total);   // the card that jumps sides
  clearTimeout(wrapTimer.current);
  wrapTimer.current = setTimeout(() => setWrapIdx(null), 800);
  setIndex(next);
  };

  const go = (step) => goTo((index + step + total) % total);

  const positionOf = (i) => {
    const d = (i - index + total) % total;
    if (d === 0) return 'active';
    if (d === 1) return 'next';
    if (d === total - 1) return 'prev';
    return 'hidden';
  };

  const onPointerDown = (e) => { pointer.current = { x: e.clientX, down: true, moved: false }; };
  const onPointerUp = (e) => {
    const p = pointer.current;
    if (!p.down) return;
    const dx = e.clientX - p.x;
    p.down = false;
    if (Math.abs(dx) > SWIPE_PX) {
      p.moved = true;
      go(dx < 0 ? 1 : -1);
      setTimeout(() => { p.moved = false; }, 60);
    }
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };

  return (
    <div
    ref={revealRef}
    className={`slider reveal reveal--up${shown ? ' is-in' : ''}`}
    style={{ '--d': '300ms' }}
    onKeyDown={onKeyDown}
    >
      <div
        className="slider__viewport"
        role="group"
        aria-roledescription="carousel"
        aria-label="Streams"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointer.current.down = false; }}
      >
        {streams.map((s, i) => {
          const pos = positionOf(i);
          const isActive = pos === 'active';
          return (
            <div
              key={s.id}
              className={`slide is-${pos}${wrapIdx === i ? ' is-wrapping' : ''}`}
              aria-hidden={!isActive}
              onClick={() => { if (!isActive && !pointer.current.moved) goTo(i); }}
            >
              <StreamCard
                stream={s}
                classLevel={classLevel}
                interactive={isActive}
                onLinkClick={(e) => { if (pointer.current.moved) e.preventDefault(); }}
              />
            </div>
          );
        })}
      </div>

      <div className="slider__controls">
        <button type="button" className="slider__arrow slider__arrow--prev" onClick={() => go(-1)} aria-label="Previous stream">
          <ArrowIcon dir="left" />
        </button>
        <div className="slider__dots" role="tablist" aria-label="Choose stream">
          {streams.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={s.name}
              className={`slider__dot${i === index ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <button type="button" className="slider__arrow slider__arrow--next" onClick={() => go(1)} aria-label="Next stream">
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}
