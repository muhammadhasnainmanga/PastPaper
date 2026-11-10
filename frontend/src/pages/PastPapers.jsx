import Reveal from '../components/Reveal/Reveal.jsx';
import PaperFinder from '../components/PaperFinder/PaperFinder.jsx';
import { useSeo } from '../hooks/useSeo.js';

export default function PastPapers() {
  useSeo({
    title: 'Sindh Board Past Papers: Class 11 & 12 by Subject & Year',
    description: 'Class 11 (1st year) and Class 12 (2nd year) Sindh Board past papers, 2021 to 2026. Pick a subject and year for objective, subjective or full paper PDFs.',
    path: '/papers',
  });

  return (
    <section className="container finder-page">
      <Reveal className="finder-reveal">
        <PaperFinder />
      </Reveal>
    </section>
  );
}
