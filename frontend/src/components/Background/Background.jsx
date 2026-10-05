import { useEffect, useRef } from 'react';
import './Background.css';

// Fixed layer behind the whole site: faint grid, soft green washes, a cursor glow
// and little drifting dots. Cards and panels are frosted glass, so everything
// here blurs out behind them.
export default function Background() {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const glow = glowRef.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dots = [], raf = 0;
    let scrollY = window.scrollY;
    const mouse = { x: -9999, y: -9999 };

    // glow state
    let gx = window.innerWidth / 2;
    let gy = window.innerHeight * 0.38;
    let tx = gx, ty = gy, active = false, fade = 1;

    const makeDots = () => {
      const count = Math.max(34, Math.min(120, Math.round((w * h) / 17000)));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.1 + Math.random() * 1.7,
        z: 0.3 + Math.random() * 0.7,           // depth: deeper dots move less on scroll
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        a: 0.22 + Math.random() * 0.33,
        t: Math.random() * Math.PI * 2,
      }));
    };

    const updateGlow = () => {
      if (!active) { tx = w / 2; ty = h * 0.38; }   // rest near the header
      gx += (tx - gx) * 0.07;
      gy += (ty - gy) * 0.07;
      // when you aren't pointing, it fades out as you scroll past the header
      const target = active ? 1 : Math.max(0, 1 - scrollY / (h * 0.7));
      fade += (target - fade) * 0.08;
      glow.style.transform =
        `translate3d(${gx}px, ${gy}px, 0) translate(-50%, -50%) scale(${0.85 + 0.15 * fade})`;
      glow.style.opacity = fade;
    };

    const draw = (time) => {
      updateGlow();
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        if (!reduce) {
          d.x += d.vx; d.y += d.vy;
          if (d.x < -5) d.x = w + 5; else if (d.x > w + 5) d.x = -5;
          if (d.y < -5) d.y = h + 5; else if (d.y > h + 5) d.y = -5;
        }
        let px = d.x;
        let py = (((d.y - scrollY * d.z * 0.3) % h) + h) % h;

        const dx = px - mouse.x, dy = py - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 && dist > 0) {
          const f = (120 - dist) / 120;
          px += (dx / dist) * f * 22;
          py += (dy / dist) * f * 22;
        }

        const alpha = d.a * (0.75 + 0.25 * Math.sin(time / 1600 + d.t));
        ctx.fillStyle = `rgba(55, 105, 80, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      const widthChanged = nw !== w;
      const bigHeightChange = Math.abs(nh - h) > 150; // ignore phone address-bar resizes
      w = nw; h = nh;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!dots.length || widthChanged || bigHeightChange) makeDots();
      if (reduce) draw(0);
    };

    const onScroll = () => { scrollY = window.scrollY; if (reduce) draw(0); };
    const onMove = (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      tx = e.clientX; ty = e.clientY; active = true;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; active = false; };
    const onUp = (e) => { if (e.pointerType === 'touch') onLeave(); };

    resize();
    if (!reduce) raf = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="bg" aria-hidden="true">
      <div className="bg__wash bg__wash--top" />
      <div className="bg__wash bg__wash--bottom" />
      <div ref={glowRef} className="bg__glow" />
      <div className="bg__grid" />
      <canvas ref={canvasRef} className="bg__dots" />
    </div>
  );
}