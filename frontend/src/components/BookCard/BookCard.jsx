import { useState } from 'react';
import { useMedia } from '../../hooks/useMedia.js';
import { DownloadIcon, EyeIcon } from '../Icons/Icons.jsx';
import { formatSize } from '../../utils/formatSize.js';
import { bookOpenUrl, bookDownloadUrl, guardBookLink } from '../../api/books.js';
import './BookCard.css';

export default function BookCard({ book }) {
  // new tab on desktop, same tab on phones and tablets
  const canHover = useMedia('(hover: hover) and (pointer: fine)');
  const [coverFailed, setCoverFailed] = useState(false);

  const size = formatSize(book.size);
  const target = canHover ? '_blank' : '_self';
  const what = `${book.title}, Class ${book.classLevel}${size ? `, ${size}` : ''}`;

  return (
    <article className="bcard">
      {/* the cover opens the book too; the View button below is the keyboard-friendly link */}
      <a className="bcard__plate" href={bookOpenUrl(book.id)} target={target}
        rel="noopener noreferrer" onClick={guardBookLink} aria-hidden="true" tabIndex={-1}>
        {book.cover && !coverFailed ? (
          <img className={`bcard__cover${book.title.toLowerCase() === 'computer' ? ' bcard__cover--computer' : ''}`}
            src={book.cover} alt="" loading="lazy"
            onError={() => setCoverFailed(true)} />
        ) : (
          <span className="bcard__cover bcard__cover--blank">
            <span className="bcard__cover-title">{book.title}</span>
            <span className="bcard__cover-class">Class {book.classLevel}</span>
          </span>
        )}
      </a>

      <div className="bcard__info">
        <h3 className="bcard__title">{book.title}</h3>
        <p className="bcard__meta">Class {book.classLevel}{size ? ` · ${size}` : ''}</p>
      </div>

      <div className="bbtn">
        <a className="bbtn__open" href={bookOpenUrl(book.id)} target={target}
          rel="noopener noreferrer" onClick={guardBookLink} aria-label={`Open ${what}`} title="Open book">
          <span>View</span>
          <span className="bbtn__eye" aria-hidden="true"><EyeIcon width={19} height={19} /></span>
        </a>
        <a className="bbtn__dl" href={bookDownloadUrl(book.id)} download onClick={guardBookLink}
          aria-label={`Download ${what}`} title={size ? `Download (${size})` : 'Download'}>
          <DownloadIcon width={18} height={18} />
        </a>
      </div>
    </article>
  );
}