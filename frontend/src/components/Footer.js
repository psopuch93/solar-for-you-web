// src/components/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} SolarForYou. Wszelkie prawa zastrzeżone.</p>
      </div>
    </footer>
  );
};

export default Footer;