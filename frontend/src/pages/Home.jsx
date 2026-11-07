import Hero from '../components/Hero/Hero.jsx';
import StreamsSection from '../components/StreamsSection/StreamsSection.jsx';
import { useSeo } from '../hooks/useSeo.js';

export default function Home() {
  useSeo({
    title: 'Sindh Board Class 11 & 12 Past Papers, Books & MCQs | PastPaper',
    description: 'Download Sindh Board Class 11 and 12 past papers by subject and year, plus free books and MCQ practice.',
    path: '/',
  });

  return (
    <>
      <Hero />
      <StreamsSection />
    </>
  );
}
