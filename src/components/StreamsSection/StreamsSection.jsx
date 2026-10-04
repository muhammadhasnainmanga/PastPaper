import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClassToggle from '../ClassToggle/ClassToggle.jsx';
import StreamSlider from './StreamSlider.jsx';
import { STREAMS } from '../../data/streams.js';
import './StreamsSection.css';
import Reveal from '../Reveal/Reveal.jsx';

export default function StreamsSection() {
  const [classLevel, setClassLevel] = useState(11);

  return (
    <section className="container streams" id="streams">
      <div className="streams__panel">
        <Reveal as="span" className="pill-label">Streams</Reveal>
        <Reveal as="h2" variant="line" delay={80} className="streams__title">Choose your stream</Reveal>
        <Reveal delay={300}><ClassToggle value={classLevel} onChange={setClassLevel} /></Reveal>

        <StreamSlider streams={STREAMS} classLevel={classLevel} />

        <Link to="/papers" className="btn btn--dark">Explore all past papers</Link>
      </div>
    </section>
  );
}
