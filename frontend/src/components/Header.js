// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">SolarForYou</Link>
        </div>
        <nav>
          <ul className="nav-menu">
            <li><Link to="/">Strona główna</Link></li>
            <li><Link to="/projects">Projekty</Link></li>
            <li><Link to="/profile">Profil</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;