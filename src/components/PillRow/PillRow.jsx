import PickerMenu from '../PickerMenu/PickerMenu.jsx';
import { PlusIcon, CloseIcon, ChevronIcon } from '../Icons/Icons.jsx';
import './PillRow.css';

export default function PillRow({ label, noun, options, value, onChange, allLabel }) {
  const labelOf = (v) => options.find((o) => o.value === v)?.label ?? v;
  const isAll = value.length === 0;
  const canRemove = value.length > 1; // the last pill can't be removed

  const pills = value.map((v) => (
    <span className="pill" key={v} title={canRemove ? undefined : `At least one ${noun} stays selected`}>
      <span className="pill__text">{labelOf(v)}</span>
      {canRemove && (
        <button type="button" className="pill__x" aria-label={`Remove ${labelOf(v)}`}
          onClick={() => onChange(value.filter((x) => x !== v))}>
          <CloseIcon width={12} height={12} strokeWidth={3} />
        </button>
      )}
    </span>
  ));

  // One PickerMenu with a stable key, so the menu stays open while you tick several items.
  const picker = (
    <PickerMenu
      key="picker" title={label} options={options} value={value}
      onChange={onChange} allLabel={allLabel}
      renderTrigger={(t) =>
        isAll ? (
          <button type="button" className="pill pill--all" {...t}>
            {allLabel}<ChevronIcon width={15} height={15} />
          </button>
        ) : (
          <button type="button" className="pill pill--add" aria-label={`Add ${noun}`} title={`Add ${noun}`} {...t}>
            <PlusIcon width={16} height={16} strokeWidth={2.6} />
          </button>
        )
      }
    />
  );

  return (
    <div className="pillrow">
      <span className="pillrow__label">{label}</span>
      <div className="pillrow__pills">{[...pills, picker]}</div>
    </div>
  );
}