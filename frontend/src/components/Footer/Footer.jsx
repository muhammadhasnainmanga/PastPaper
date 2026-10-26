import { Link } from 'react-router-dom';
import './Footer.css';
import Reveal from '../Reveal/Reveal.jsx';

// Placeholder links for now. Swap with the real ones later.
const LINKS = {
  github: 'https://github.com/muhammadhasnainmanga',
  linkedin: 'https://www.linkedin.com/in/muhammad-hasnain-manga-9306bb360',
  whatsapp: 'https://wa.me/03182873948',
  board: 'https://www.biek.edu.pk/',
};

export default function Footer() {
  return (
    <footer className="container footer-wrap">
      <Reveal className="footer glass">
        <div className="footer__col">
          <h3>Developer</h3>
          <a href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={LINKS.whatsapp} target="_blank" rel="noreferrer">Whatsapp</a>
        </div>
        <div className="footer__col">
          <h3>Board</h3>
          <a href={LINKS.board} target="_blank" rel="noreferrer">Official board website</a>
          <p>Karachi, Sindh, Pakistan</p>
        </div>
      </Reveal>
      <p className="footer__note">Made for Sindh Board students. Not affiliated with the board.</p>
    </footer>
  );
}
