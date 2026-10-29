const base = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};
export const PlusIcon = (p) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const CloseIcon = (p) => <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const ChevronIcon = (p) => <svg {...base} {...p}><path d="M6 9l6 6 6-6" /></svg>;
export const DownloadIcon = (p) => <svg {...base} {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>;
export const EditIcon = (p) => <svg {...base} {...p}><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>;
export const EyeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12.5C7 4.5 17 4.5 20 12.5" strokeWidth="2.2" />
    <circle cx="12" cy="12.6" r="2.6" fill="currentColor" stroke="none" />
  </svg>
);
export const CheckIcon = (p) => <svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;