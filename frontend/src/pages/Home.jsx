import Hero from '../components/Hero/Hero.jsx';
import StreamsSection from '../components/StreamsSection/StreamsSection.jsx';
import { useSeo } from '../hooks/useSeo.js';
import './Home.css';

export default function Home() {
  useSeo({
    title: 'Sindh Board Past Papers, Books & MCQs: Class 11 & 12 (BIEK)',
    description: 'Download Sindh Board (BIEK Karachi) Class 11 and 12 past papers by subject and year, free STBB textbooks and MCQ quiz practice.',
    path: '/',
  });

  return (
    <main className="home-page">
      <Hero />
      <StreamsSection />
    </main>
  );
}
