import './Switch.css';

export default function Switch({ label, checked, onChange, hint }) {
  return (
    <button type="button" role="switch" aria-checked={checked} title={hint}
      className={`switch${checked ? ' is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <span className="switch__track"><span className="switch__knob" /></span>
    </button>
  );
}