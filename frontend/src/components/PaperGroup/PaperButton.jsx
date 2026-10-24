import { useMedia } from '../../hooks/useMedia.js';
import { DownloadIcon, EyeIcon } from '../Icons/Icons.jsx';
import { formatSize } from '../../utils/formatSize.js';
import { paperOpenUrl, paperDownloadUrl, guardLink } from '../../api/papers.js';

export default function PaperButton({ type, file, name, group }) {
  // new tab on desktop, same tab on phones and tablets
  const canHover = useMedia('(hover: hover) and (pointer: fine)');

  // "Full paper (Science General)"
  const title = (
    <span className="pbtn__label">
      {type.label}
      {group && <span className="pbtn__group"> ({group.name})</span>}
    </span>
  );

  if (!file) {
    return (
      <div className="pbtn is-off" aria-disabled="true">
        <span className="pbtn__open">
          <span className="pbtn__text">
            {title}
            <span className="pbtn__na">Not available</span>
          </span>
        </span>
      </div>
    );
  }

  const size = formatSize(file.size);
  const what = `${type.label} paper, ${name}${size ? `, ${size}` : ''}`;

  return (
    <div className="pbtn">
      <a className="pbtn__open" href={paperOpenUrl(file.id)} target={canHover ? '_blank' : '_self'}
        rel="noopener noreferrer" onClick={guardLink} aria-label={`Open ${what}`} title="Open paper">
        <span className="pbtn__text">
          {title}
          {size && <span className="pbtn__size">{size}</span>}
        </span>
        <span className="pbtn__eye" aria-hidden="true"><EyeIcon width={19} height={19} /></span>
      </a>
      <a className="pbtn__dl" href={paperDownloadUrl(file.id)} download onClick={guardLink}
        aria-label={`Download ${what}`} title={size ? `Download (${size})` : 'Download'}>
        <DownloadIcon width={18} height={18} />
      </a>
    </div>
  );
}