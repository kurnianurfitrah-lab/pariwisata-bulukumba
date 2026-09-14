import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import TranslateWidget from './TranslateWidget';

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const linkClass = ({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'font-semibold' : ''}`;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="navbar bg-base-100 border-b">
      <div className="container mx-auto px-4">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">Bulukumba Tourism</Link>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex flex-none items-center space-x-4">
          <ul className="menu menu-horizontal px-1 items-center">
            <li><NavLink to="/" className={linkClass}>Beranda</NavLink></li>
            <li><NavLink to="/attractions" className={linkClass}>Wisata</NavLink></li>
            <li><NavLink to="/hotels" className={linkClass}>Hotel</NavLink></li>
            <li><NavLink to="/restorans" className={linkClass}>Restoran</NavLink></li>
            <li><NavLink to="/events" className={linkClass}>Event</NavLink></li>
            <li><NavLink to="/gallery" className={linkClass}>Galeri</NavLink></li>
          </ul>
          <TranslateWidget />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex-none">
          <button
            onClick={toggleMenu}
            className="btn btn-square btn-ghost"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div  style={{ top: '65px'}} className="md:hidden absolute top-full left-0 right-0 bg-base-100 border-b border-gray-200 shadow-lg z-50">
          <ul className="menu menu-vertical px-4 py-2">
            <li>
              <NavLink 
                to="/" 
                className={linkClass}
                onClick={closeMenu}
              >
                Beranda
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/attractions" 
                className={linkClass}
                onClick={closeMenu}
              >
                Wisata
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/hotels" 
                className={linkClass}
                onClick={closeMenu}
              >
                Hotel
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/restorans" 
                className={linkClass}
                onClick={closeMenu}
              >
                Restoran
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/events" 
                className={linkClass}
                onClick={closeMenu}
              >
                Event
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/gallery" 
                className={linkClass}
                onClick={closeMenu}
              >
                Galeri
              </NavLink>
            </li>
              <li className="px-3 py-2">
                <TranslateWidget />
              </li>
          </ul>
        </div>
      )}
    </div>
  );
}


