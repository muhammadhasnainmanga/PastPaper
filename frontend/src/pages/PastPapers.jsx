import Reveal from '../components/Reveal/Reveal.jsx';
import PaperFinder from '../components/PaperFinder/PaperFinder.jsx';

export default function PastPapers() {
  return (
    <section className="container finder-page">
      <Reveal className="finder-reveal">
        <PaperFinder />
      </Reveal>
    </section>
  );
}