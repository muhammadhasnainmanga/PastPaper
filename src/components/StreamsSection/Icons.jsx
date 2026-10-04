const common = {
  width: 44, height: 44, viewBox: '0 0 64 64', fill: 'none',
  stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function MedicalIcon() {
  return (
    <svg {...common}>
      <rect x="10" y="10" width="44" height="44" rx="14" />
      <path d="M32 21v22M21 32h22" />
    </svg>
  );
}
export function CodeIcon() {
  return (
    <svg {...common}>
      <path d="M22 20 10 32l12 12" />
      <path d="M42 20l12 12-12 12" />
      <path d="M36 14 28 50" />
    </svg>
  );
}
export function GearIcon() {
  return (
    <svg {...common}>
      <circle cx="32" cy="32" r="9" />
      <path d="M32 8v7M32 49v7M8 32h7M49 32h7M15 15l5 5M44 44l5 5M49 15l-5 5M20 44l-5 5" />
    </svg>
  );
}

export const ICONS = { medical: MedicalIcon, code: CodeIcon, gear: GearIcon };

export function ArrowIcon({ dir = 'right', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={dir === 'left' ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
