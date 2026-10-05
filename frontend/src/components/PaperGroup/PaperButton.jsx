import { useMedia } from '../../hooks/useMedia.js';
import { DownloadIcon } from '../Icons/Icons.jsx';
import { paperOpenUrl, paperDownloadUrl, guardLink } from '../../api/papers.js';
import { formatSize } from '../../utils/formatSize.js';

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

 const size = formatSize(file.size);

  return (
    <div className="pbtn">
      <a className="pbtn__open" href={paperOpenUrl(file.id)} target={canHover ? '_blank' : '_self'}
        rel="noopener noreferrer" onClick={guardLink}
        aria-label={`Open ${type.label} paper, ${name}${size ? `, ${size}` : ''}`}>
        <span className="pbtn__label">{type.label}</span>
        {size && <span className="pbtn__size">{size}</span>}
      </a>
      <a className="pbtn__dl" href={paperDownloadUrl(file.id)} download onClick={guardLink}
        aria-label={`Download ${type.label} paper, ${name}${size ? `, ${size}` : ''}`}
        title={size ? `Download (${size})` : 'Download'}>
        <DownloadIcon width={18} height={18} />
      </a>
    </div>
  );
}