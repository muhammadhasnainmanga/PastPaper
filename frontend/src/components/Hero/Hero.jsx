import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';
import Reveal from '../Reveal/Reveal.jsx';

const heroVideoUrl = 'https://res.cloudinary.com/g0sn2vr0/video/upload/v1794346466/1111_1.mp4';

export default function Hero() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  };

  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content">
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
        <div className="hero__media">
          <video
            ref={videoRef}
            className="hero__video"
            src={heroVideoUrl}
            playsInline
            preload="metadata"
            aria-label="Introduction to the past papers website"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          {!isPlaying && (
            <button
              className="hero__play-overlay"
              type="button"
              onClick={togglePlayback}
              aria-label="Play introduction video"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8c0-.8.9-1.3 1.6-.9l10 6.2a1 1 0 0 1 0 1.8l-10 6.2c-.7.4-1.6-.1-1.6-.9V5.8Z" /></svg>
            </button>
          )}
          {isPlaying && (
            <button
              className="hero__play-overlay hero__pause-overlay"
              type="button"
              onClick={togglePlayback}
              aria-label="Pause video"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM15 5h4v14h-4z" /></svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
