import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiMail, FiInfo, FiLogIn, FiUser, FiSettings, FiLogOut, FiChevronDown, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  // Set active link based on current path
  const getActiveLink = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/chalets') return 'buy';
    if (path === '/rent') return 'rent';
    if (path === '/about') return 'about';
    if (path === '/contact') return 'contact';
    return '';
  };

  const activeLink = getActiveLink();

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const handleHomeClick = () => {
    closeMenu();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    closeMenu();
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && 
          !event.target.closest('.navbar-links') && 
          !event.target.closest('.menu-toggle')) {
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
      }
      
      if (!isMobile && isDropdownOpen && 
          !event.target.closest('.navbar-user')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, isDropdownOpen, isMobile]);

  // Handle body overflow - FIXED VERSION
  useEffect(() => {
    if (isMenuOpen && isMobile) {
      // Store original overflow values
      const originalOverflow = document.body.style.overflow;
      const originalOverflowX = document.body.style.overflowX;
      const originalOverflowY = document.body.style.overflowY;
      
      // Only prevent vertical scrolling, allow horizontal
      document.body.style.overflowY = 'hidden';
      document.body.style.overflowX = 'auto';
      
      return () => {
        // Restore original values
        document.body.style.overflow = originalOverflow;
        document.body.style.overflowX = originalOverflowX;
        document.body.style.overflowY = originalOverflowY;
      };
    }
  }, [isMenuOpen, isMobile]);

  // Get username from email
  const getUserName = () => {
    if (!user || !user.email) return '';
    const emailParts = user.email.split('@');
    return emailParts[0];
  };

  const handleDropdownItemClick = () => {
    setIsDropdownOpen(false);
    if (isMobile) {
      closeMenu();
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        <div className="navbar-logo">
          <Link to="/" onClick={handleHomeClick}>
            Chalets Suisses
          </Link>
        </div>

        <div 
          className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <li>
            <Link 
              to="/" 
              className={activeLink === 'home' ? 'active' : ''} 
              onClick={handleHomeClick}
            >
              <FiHome /> Home
            </Link>
          </li>
          <li>
            <Link 
              to="/chalets" 
              className={activeLink === 'buy' ? 'active' : ''} 
              onClick={closeMenu}
            >
              <FiSearch /> Buy Chalets         
            </Link>
          </li>
          <li>
            <Link 
              to="/coming-soon" 
              onClick={closeMenu}
            >
              <FiSearch /> Price Estimate
            </Link>
          </li>
          <li>
            <Link 
              to="/contact" 
              className={activeLink === 'contact' ? 'active' : ''} 
              onClick={closeMenu}
            >
              <FiMail /> Contact Us
            </Link>
          </li>

          {isAuthenticated ? (
            <div className="navbar-user">
              <div 
                onClick={isMobile ? toggleDropdown : undefined}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  cursor: isMobile ? 'pointer' : 'default',
                  width: '100%'
                }}
              >
                <FiUser />
                <span className="username">{getUserName()}</span>
                {isMobile && <FiChevronDown style={{ 
                  marginLeft: 'auto',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }} />}
              </div>
              
              {/* Dropdown menu - conditionally rendered based on state and mobile */}
              {((isMobile && isDropdownOpen) || (!isMobile)) && (
                <div className="dropdown-menu" style={{
                  display: isMobile ? (isDropdownOpen ? 'block' : 'none') : undefined
                }}>
                  {user.is_admin ? (
                    <Link to="/admin-dashboard" onClick={handleDropdownItemClick}>
                      <FiSettings /> Admin Dashboard
                    </Link>
                  ) : (
                    <Link to="/user-dashboard" onClick={handleDropdownItemClick}>
                      <FiSettings /> My Dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout}>
                    <FiLogOut /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="login-btn" onClick={closeMenu}>
                <FiLogIn /> Login / Sign Up
              </Link>
            </div>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;