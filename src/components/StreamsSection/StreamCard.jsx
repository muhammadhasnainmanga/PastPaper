import { Link } from 'react-router-dom';
import { ICONS, ArrowIcon } from './Icons.jsx';
import { YEARS_OF_PAPERS, listSubjects } from '../../data/streams.js';

export default function StreamCard({ stream, classLevel, interactive, onLinkClick }) {
  const subjects = stream.subjects[classLevel];
  const Icon = ICONS[stream.icon];

  return (
    <article className="scard">
      <div className="scard__tile">
        <span className="scard__ring scard__ring--a" />
        <span className="scard__ring scard__ring--b" />
        <div className="scard__icon"><Icon /></div>
      </div>

      <div className="scard__body">
        <div className="scard__top">
          <span className="scard__chip">Class {classLevel}</span>
          <h3 className="scard__title">{stream.name}</h3>
          <p className="scard__desc">{listSubjects(subjects)}.</p>
          <Link
            to={`/papers?stream=${stream.id}&class=${classLevel}`}
            className="scard__link"
            tabIndex={interactive ? 0 : -1}
            onClick={onLinkClick}
          >
            Click to view
            <span className="scard__link-dot"><ArrowIcon size={13} /></span>
          </Link>
        </div>

        <dl className="scard__stats">
          <div><dd>{subjects.length}</dd><dt>Subjects</dt></div>
          <div><dd>{YEARS_OF_PAPERS}</dd><dt>Years</dt></div>
          <div><dd>{subjects.length * YEARS_OF_PAPERS}</dd><dt>Papers</dt></div>
        </dl>
      </div>
    </article>
  );
}
