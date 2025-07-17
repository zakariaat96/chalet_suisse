import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../styles/Hero.css';
import { FiSearch, FiArrowRight } from 'react-icons/fi';

const Hero = () => {
  // Images for the carousel
  const images = [
  process.env.PUBLIC_URL + "/assets/Swiss_chalet_1.jpg",
  process.env.PUBLIC_URL + "/assets/Swiss_chalet_2.jpg",
  process.env.PUBLIC_URL + "/assets/Swiss_chalet_3.jpg",
  process.env.PUBLIC_URL + "/assets/Swiss_chalet_4.jpg",
];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to move to next slide
  const nextSlide = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  // Function to move to previous slide (not used in current UI but good to keep)
  const prevSlide = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  // Function to move to a specific slide
  const goToSlide = (index) => {
    setCurrentImageIndex(index);
  };

  // Automatic slide change
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle search functionality
  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/chalets?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/chalets'); // If no search term, go to all properties
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="hero">
      {/* Decorative elements */}
      <div className="hero-decoration hero-circle"></div>
      <div className="hero-decoration hero-dots"></div>
      
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Find Your Dream Chalets in Switzerland
          </h1>
          <p className="hero-subtitle">
            Only the finest chalets, chosen for you.
            We have hand-selected the most beautiful and perfect Swiss chalets, offering an unmatched blend of luxury, comfort, and stunning natural surroundings.
          </p>
          
          <div className="hero-search-bar"> 
            <input
              type="text"
              placeholder="Search by location, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress} 
              className="hero-search-input"
            />
            <button onClick={handleSearch} className="hero-btn hero-btn-primary">
              <FiSearch /> Search <FiArrowRight />
            </button>
          </div>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">10+</span>
              <span className="hero-stat-label">Chalets</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">95%</span>
              <span className="hero-stat-label">Customer Satisfaction</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">15+</span>
              <span className="hero-stat-label">Years Experience</span>
            </div>
          </div>
        </div>
        
        <div className="hero-image-container">
          {/* Image slider */}
          <div className="hero-carousel">
            {images.map((image, index) => (
              <img 
                key={index}
                src={image} 
                alt={`Luxury Swiss home ${index + 1}`} 
                className={`hero-image ${index === currentImageIndex ? 'active' : ''}`}
              />
            ))}

            {/* Dots navigation */}
            <div className="carousel-dots">
              {images.map((_, index) => (
                <button 
                  key={index} 
                  className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;