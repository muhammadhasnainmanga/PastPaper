import { useMedia } from '../../hooks/useMedia.js';
import { DownloadIcon } from '../Icons/Icons.jsx';
import { paperOpenUrl, paperDownloadUrl, guardLink } from '../../api/papers.js';

export default function PaperButton({ type, file, name }) {
  // new tab on desktop, same tab on phones and tablets
  const canHover = useMedia('(hover: hover) and (pointer: fine)');

  if (!file) {
    return (
      <div className="pbtn is-off" aria-disabled="true">
        <span className="pbtn__open">
          <span className="pbtn__label">{type.label}</span>
          <span className="pbtn__na">Not available</span>
        </span>
      </div>
    );
  }

  return (
    <div className="pbtn">
      <a className="pbtn__open" href={paperOpenUrl(file.id)} target={canHover ? '_blank' : '_self'}
        rel="noopener noreferrer" onClick={guardLink} aria-label={`Open ${type.label} paper, ${name}`}>
        <span className="pbtn__label">{type.label}</span>
      </a>
      <a className="pbtn__dl" href={paperDownloadUrl(file.id)} download onClick={guardLink}
        aria-label={`Download ${type.label} paper, ${name}`} title="Download">
        <DownloadIcon width={18} height={18} />
      </a>
    </div>
  );
}