import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/papers', label: 'Past Papers' },
  { to: '/books', label: 'Books'},
  { to: '/developer', label: 'Developer' }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  const linkClass = ({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`;

  return (
    <header className="nav-wrap">
      <div className="nav glass">
        <Link to="/" className="nav__brand">
          <span className="nav__brand-dot" />
          PastPaper
        </Link>

        <nav className="nav__links" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
          ))}
        </nav>

        {/* <div className="nav__classes">
          <Link to="/papers?class=11">Class 11</Link>
          <Link to="/papers?class=12">Class 12</Link>
        </div> */}

        <button
          type="button"
          className={`nav__menu${open ? ' is-open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span />
        </button>
      </div>

      {open && (
        <div className="nav__sheet glass">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
          ))}
          <div className="nav__sheet-classes">
            <Link to="/papers?class=11">Class 11</Link>
            <Link to="/papers?class=12">Class 12</Link>
          </div>
        </div>
      )}
    </header>
  );
}
