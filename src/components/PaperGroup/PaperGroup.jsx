import { useId } from 'react';
import PaperButton from './PaperButton.jsx';
import { ChevronIcon, DownloadIcon } from '../Icons/Icons.jsx';
import { PAPER_TYPES } from '../../data/streams.js';
import { groupDownloadUrl, guardLink } from '../../api/papers.js';
import './PaperGroup.css';

export default function PaperGroup({ index, title, meta, rows, show, collapsible, collapsed, onToggle }) {
  const bodyId = useId();
  const visible = show === 'all' ? PAPER_TYPES : PAPER_TYPES.filter((t) => t.key === show);
  const ids = rows.flatMap((r) => visible.map((t) => r.files[t.key]?.id).filter(Boolean));

  return (
    <section className={`pgroup${collapsed ? ' is-collapsed' : ''}`} style={{ '--i': index }}>
      <div className="pgroup__head">
        {collapsible ? (
          <button type="button" className="pgroup__toggle" aria-expanded={!collapsed}
            aria-controls={bodyId} onClick={onToggle}>
            <span className="pgroup__title">{title}</span>
            <span className="pgroup__meta">{meta}</span>
            <ChevronIcon className="pgroup__chev" width={20} height={20} />
          </button>
        ) : (
          <div className="pgroup__toggle pgroup__toggle--static">
            <span className="pgroup__title">{title}</span>
            <span className="pgroup__meta">{meta}</span>
          </div>
        )}

        {ids.length ? (
          <a className="pgroup__dlall" href={groupDownloadUrl(ids)} download onClick={guardLink}
            aria-label={`Download all ${title} papers`} title={`Download all ${visible[0].label} papers as ZIP`}>
            <DownloadIcon width={19} height={19} />
          </a>
        ) : (
          <span className="pgroup__dlall is-off" aria-hidden="true"><DownloadIcon width={19} height={19} /></span>
        )}
      </div>

      <div className="pgroup__body" id={bodyId} inert={collapsed ? '' : undefined}>
        <div className="pgroup__inner">
          {rows.map((row) => (
            <div key={row.key} className={`prow${visible.length === 1 ? ' is-single' : ''}`} style={{ '--n': visible.length }}>
              <div className="prow__label">{row.label}</div>
              <div className="prow__btns">
                {visible.map((t) => (
                  <PaperButton key={t.key} type={t} file={row.files[t.key]} name={row.name} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}