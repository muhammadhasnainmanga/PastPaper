import { Link } from 'react-router-dom';
import './Hero.css';
import Reveal from '../Reveal/Reveal.jsx';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <h1 className="hero__title">
          <Reveal as="span" variant="line">All Your Past Papers.</Reveal>
          <Reveal as="span" variant="line" delay={120}>One Place.</Reveal>
        </h1>
        <Reveal as="p" className="hero__sub" delay={320}>
          Every Sindh Board Class 11 and 12 past paper, sorted by stream and subject.
        </Reveal>
        <Reveal className="hero__actions" delay={460}>
          <Link to="/papers" className="btn btn--dark">Browse papers <span aria-hidden="true">→</span></Link>
          <a href="#streams" className="btn btn--glass">Pick your stream</a>
        </Reveal>
      </div>
    </section>
  );
}