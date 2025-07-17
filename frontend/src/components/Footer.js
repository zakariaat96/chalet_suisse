import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { 
  FiHome, 
  FiMail, 
  FiInfo, 
  FiSend, 
  FiMapPin,
  FiPhone,
  FiChevronRight
} from 'react-icons/fi';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedinIn 
} from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  const handleHomeClick = () => {
    navigate('/');
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      setSubmitMessage('Please enter your email address.');
      setSubmitStatus('error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      setSubmitMessage('Please enter a valid email address.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitStatus('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/contact_form.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: newsletterEmail.trim(),
          formType: 'newsletter'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage(data.message);
        setSubmitStatus('success');
        setNewsletterEmail('');
      } else {
        setSubmitMessage(data.message || 'Failed to subscribe. Please try again.');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setSubmitMessage('Network error. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setSubmitMessage('');
      setSubmitStatus('');
    }, 5000);
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-row">
            {/* Brand Column */}
            <div className="footer-col">
              <div className="footer-logo-container">
                <Link to="/" className="footer-logo" onClick={handleHomeClick}>
                  Chalets Suisses
                </Link>
              </div>
              <p className="footer-tagline">
                We found for you the best chalets existing in Switzerland
              </p>
              <div className="social-icons">
                <a href="https://facebook.com" aria-label="Facebook" className="social-link">
                  <FaFacebookF />
                </a>
                <a href="https://twitter.com" aria-label="Twitter" className="social-link">
                  <FaTwitter />
                </a>
                <a href="https://instagram.com" aria-label="Instagram" className="social-link">
                  <FaInstagram />
                </a>
                <a href="https://linkedin.com" aria-label="LinkedIn" className="social-link">
                  <FaLinkedinIn />
                </a>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="footer-col">
              <h3 className="footer-heading">Quick Links</h3>
              <ul className="footer-menu">
                <li>
                  <Link to="/" onClick={handleHomeClick}>
                    <FiChevronRight />
                    <span>Home</span>
                  </Link>
                </li>
                <li>
                  <Link to="/chalets">
                    <FiChevronRight />
                    <span>Buy Chalets </span>
                  </Link>
                </li>
                <li>
                  <Link to="/coming-soon">
                    <FiChevronRight />
                    <span>Price Estimate </span>
                  </Link>
                </li>
                <li>
                  <Link to="/about">
                    <FiChevronRight />
                    <span>About Us</span>
                  </Link>
                </li>
                <li>
                  <Link to="/contact">
                    <FiChevronRight />
                    <span>Contact</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info Column */}
            <div className="footer-col">
              <h3 className="footer-heading">Contact Us</h3>
              <ul className="footer-contact">
                <li>
                  <FiMapPin />
                  <span>Pl. Numa-Droz 2000 Neuchâtel Switzerland</span>
                </li>
                <li>
                  <FiPhone />
                  <a href="tel:+41791234567">+41 79 123 45 67</a>
                </li>
                <li>
                  <FiMail />
                  <a href="mailto:senent@orbi.network">senent@orbi.network</a>
                </li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className="footer-col">
              <h3 className="footer-heading">Newsletter</h3>
              <p className="newsletter-text">Stay updated with our latest Chalets and offers</p>
              
              {submitMessage && (
                <div className={`newsletter-message ${submitStatus}`}>
                  {submitMessage}
                </div>
              )}
              
              <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
                <div className="form-group">
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Your email address" 
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required 
                    disabled={isSubmitting}
                  />
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '...' : <FiSend />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Chalets Suisses. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;