import Reveal from '../components/Reveal/Reveal.jsx';
import PaperFinder from '../components/PaperFinder/PaperFinder.jsx';
import { useSeo } from '../hooks/useSeo.js';

export default function PastPapers() {
  useSeo({
    title: 'Sindh Board Past Papers: Class 11 & 12 by Subject and Year | PastPaper',
    description: 'Choose your class, stream, subject and year to get Sindh Board past papers as objective, subjective or full PDFs.',
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
