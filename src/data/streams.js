// Single source of truth for streams, subjects and counts.
// The Node.js backend can replace this file with an API call later.

export const YEARS = [2026, 2025, 2024, 2023, 2022];
export const YEARS_OF_PAPERS = YEARS.length;

// "Statistics (Optional)" becomes "statistics", used in URLs
export const slug = (name) =>
  name.toLowerCase().replace(/\s*\(optional\)/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const MEDICAL_11 = ['Botany', 'Zoology', 'Physics', 'Chemistry', 'Urdu', 'English', 'Islamiyat'];
const MEDICAL_12 = ['Botany', 'Zoology', 'Physics', 'Chemistry', 'Urdu', 'English', 'Pakistan Studies'];

const CS_11 = ['Physics', 'Statistics (Optional)', 'Maths', 'Urdu', 'English', 'Computer Science', 'Islamiyat'];
const CS_12 = ['Physics', 'Statistics (Optional)', 'Maths', 'Urdu', 'English', 'Computer Science', 'Pakistan Studies'];

const ENG_11 = ['Physics', 'Chemistry', 'Statistics (Optional)', 'Maths', 'Urdu', 'English', 'Islamiyat'];
const ENG_12 = ['Physics', 'Chemistry', 'Statistics (Optional)', 'Maths', 'Urdu', 'English', 'Pakistan Studies'];

export const STREAMS = [
  { id: 'pre-medical', name: 'Pre-Medical', icon: 'medical', subjects: { 11: MEDICAL_11, 12: MEDICAL_12 } },
  { id: 'computer-science', name: 'Computer Science', icon: 'code', subjects: { 11: CS_11, 12: CS_12 } },
  { id: 'pre-engineering', name: 'Pre-Engineering', icon: 'gear', subjects: { 11: ENG_11, 12: ENG_12 } },
];

export const CLASSES = [
  { value: 11, label: 'Class 11' },
  { value: 12, label: 'Class 12' },
];

export function listSubjects(subjects) {
  if (subjects.length < 2) return subjects.join('');
  return `${subjects.slice(0, -1).join(', ')} and ${subjects[subjects.length - 1]}`;
}

export const PAPER_TYPES = [
  { key: 'subjective', label: 'Subjective' },
  { key: 'objective', label: 'Objective' },
  { key: 'full', label: 'Full paper' },
];
