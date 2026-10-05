import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Background from './components/Background/Background.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Home from './pages/Home.jsx';
import PastPapers from './pages/PastPapers.jsx';
import PaperResults from './pages/PaperResults.jsx';
import Developer from './pages/Developer.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <Background />
      <div className="app">
        <ScrollToTop />
        <Navbar />
        <main key={location.pathname} className="page">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/papers" element={<PastPapers />} />
            <Route path="/papers/results" element={<PaperResults />} />
            <Route path="/developer" element={<Developer />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
}