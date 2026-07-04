// Header.js
import React from 'react';
import './Header.css';

const Header = ({ showHelp = true, logoInitial = 'T' }) => {
  return (
    <div className="header">
      <div className="logo">
        <div className="logo-icon">{logoInitial}</div>
        <div className="logo-text">Tala Mkopo Extra</div>
      </div>
      {showHelp && (
        <a href="/#" className="help-link">
          <span>Help</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </a>
      )}
    </div>
  );
};

export default Header;
