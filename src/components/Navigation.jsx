import PropTypes from 'prop-types';
import { useState, useRef, useEffect } from 'react';

/**
 * Navigation Component
 * Main app navigation with mobile menu support
 */
function Navigation({ currentView, onNavigate, onUpgradeClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  const navItems = [
    { id: 'search', label: 'Discover' },
    { id: 'favorites', label: 'My Favorites' },
    { id: 'about', label: 'About' }
  ];

  const handleNavClick = (viewId) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="header" role="banner">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <a 
            href="#home" 
            className="logo" 
            onClick={(e) => { 
              e.preventDefault(); 
              onNavigate('search'); 
            }}
            aria-label="SavorAI - Go to homepage"
          >
            <div className="logo-gradient-bg">
              <span className="logo-icon" aria-hidden="true">🍳</span>
            </div>
            <span>SavorAI</span>
          </a>

          {/* Mobile menu button */}
          <button
            ref={menuButtonRef}
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="main-navigation"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>

          {/* Navigation */}
          <nav 
            ref={menuRef}
            id="main-navigation"
            className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}
            aria-label="Main navigation"
          >
            <ul className="nav-links" role="menubar">
              {navItems.map((item) => (
                <li key={item.id} role="none">
                  <a 
                    href={`#${item.id}`}
                    className={`nav-link-with-indicator ${currentView === item.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    role="menuitem"
                    aria-current={currentView === item.id ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                    {currentView === item.id && (
                      <div className="nav-indicator" aria-hidden="true"></div>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Upgrade button */}
          <button 
            id="upgradeBtn" 
            className="btn-upgrade"
            onClick={onUpgradeClick}
            aria-label="Upgrade to Pro"
          >
            <span>Upgrade to Pro</span>
            <div className="upgrade-shimmer" aria-hidden="true"></div>
          </button>
        </div>
      </div>
    </header>
  );
}

Navigation.propTypes = {
  currentView: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onUpgradeClick: PropTypes.func.isRequired
};

export default Navigation;
