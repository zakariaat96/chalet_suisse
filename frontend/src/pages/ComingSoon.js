import React, { useState, useEffect } from 'react';
import '../styles/ComingSoon.css';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';

const SimpleComingSoon = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Add animation after component mounts
    setTimeout(() => {
      setIsVisible(true);
    }, 300);
  }, []);

  return (
    <div>
      <NavBar />
      <div className="coming-soon-container">
        <div className={`coming-soon-content ${isVisible ? 'visible' : ''}`}>
          <div className="animated-background">
            <div className="shape shape1"></div>
            <div className="shape shape2"></div>
            <div className="shape shape3"></div>
          </div>
          
          <h1 className="coming-soon-title">
            <span className="gradient-text">Coming Soon</span>
          </h1>
          
          <p className="coming-soon-description">
            We're working hard on something amazing. Stay tuned!
          </p>
          
          <div className="coming-soon-footer">
            <p>Contact us at <a href="mailto:senent@orbi.network">senent@orbi.network</a></p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SimpleComingSoon;