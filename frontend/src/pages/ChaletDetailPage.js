import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiMapPin, FiHome, FiLayers, FiDroplet, FiUsers, FiCalendar, 
  FiStar, FiWifi, FiCoffee, FiChevronLeft, FiChevronRight, 
  FiX, FiEye, FiPackage, FiHeart, FiFilm, 
  FiSun, FiUser, FiCheck, FiShield, FiTv,
  FiZap, FiWind, FiThermometer, FiAperture, FiCamera,
  FiMusic, FiVolume2, FiSmartphone, FiMonitor, FiTool,
  FiBook
} from 'react-icons/fi';
import { 
  FaSnowflake, FaSkiing, FaHotTub, FaFire, FaParking,
  FaDumbbell, FaSwimmingPool, FaSpa, FaGamepad,
  FaBicycle, FaUtensils, FaWineGlass, FaCar,
  FaLeaf, FaFirstAid, FaBaby, FaPaw
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChaletMapEmbed from '../components/ChaletMapEmbed';
import NewLikeButton from '../components/NewLikeButton'; // Import the new like button
import { useAuth } from '../contexts/AuthContext';
import '../styles/ChaletDetailPage.css';

const formatImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder.jpg";
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  return `${process.env.REACT_APP_BASE_URL}/${cleanPath}`;
};

const ChaletDetailPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const propertyIdFromState = location.state?.propertyId;
  const navigate = useNavigate();
  const contactFormRef = useRef(null);
  
  // UI State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(new Set());
  
  // Data state
  const [chalet, setChalet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Like state
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState(''); // 'success' or 'error'
  
  const { isAuthenticated, user } = useAuth();

  // Memoized amenity icon mapping to prevent recreation on every render
  const amenityIconMap = useMemo(() => ({
    'Wi-Fi': { icon: <FiWifi />, category: 'connectivity' },
    'WiFi': { icon: <FiWifi />, category: 'connectivity' },
    'Internet': { icon: <FiWifi />, category: 'connectivity' },
    'Air Conditioning': { icon: <FiWind />, category: 'comfort' },
    'Heating': { icon: <FiThermometer />, category: 'comfort' },
    'Fireplace': { icon: <FaFire />, category: 'comfort' },
    'Hot Tub': { icon: <FaHotTub />, category: 'wellness' },
    'Sauna': { icon: <FaSpa />, category: 'wellness' },
    'Kitchen': { icon: <FiCoffee />, category: 'kitchen' },
    'Full Kitchen': { icon: <FaUtensils />, category: 'kitchen' },
    'TV': { icon: <FiTv />, category: 'entertainment' },
    'Swimming Pool': { icon: <FaSwimmingPool />, category: 'recreation' },
    'Pool': { icon: <FaSwimmingPool />, category: 'recreation' },
    'Gym': { icon: <FaDumbbell />, category: 'recreation' },
    'Parking': { icon: <FaParking />, category: 'services' },
    'Pet Friendly': { icon: <FaPaw />, category: 'family' },
    'Balcony': { icon: <FiEye />, category: 'outdoor' },
    'Terrace': { icon: <FiSun />, category: 'outdoor' }
  }), []);

  // Memoized functions
  const getFavoritesFromStorage = useCallback(() => {
    try {
      const favorites = localStorage.getItem('favorites');
      return favorites ? JSON.parse(favorites) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const checkIfLiked = useCallback(() => {
    if (!chalet?.id || !isAuthenticated) return false;
    const favorites = getFavoritesFromStorage();
    return Array.isArray(favorites) && favorites.includes(chalet.id.toString());
  }, [chalet?.id, isAuthenticated, getFavoritesFromStorage]);

  const getAmenityWithIcon = useCallback((amenityName) => {
    const exactMatch = amenityIconMap[amenityName];
    if (exactMatch) return exactMatch;
    
    const partialMatch = Object.keys(amenityIconMap).find(key => 
      amenityName.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(amenityName.toLowerCase())
    );
    
    if (partialMatch) return amenityIconMap[partialMatch];
    return { icon: <FiCheck />, category: 'general' };
  }, [amenityIconMap]);

  const getIconComponent = useCallback((iconName) => {
    const iconMap = {
      'FaSkiing': <FaSkiing />,
      'FaHotTub': <FaHotTub />,
      'FaFire': <FaFire />,
      'FiWifi': <FiWifi />,
      'FiCoffee': <FiCoffee />,
      'FaParking': <FaParking />,
      'FaSnowflake': <FaSnowflake />,
      'FiUsers': <FiUsers />,
      'FiEye': <FiEye />,
      'FiPackage': <FiPackage />
    };
    return iconMap[iconName] || <FiCheck />;
  }, []);

  // Contact form handlers
  const handleContactFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleContactFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setSubmitMessage('Please fill in all required fields.');
      setSubmitStatus('error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
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
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          phone: contactForm.phone.trim(),
          message: contactForm.message.trim(),
          propertyTitle: chalet?.title || '',
          propertyId: chalet?.id || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage(data.message);
        setSubmitStatus('success');
        // Reset form
        setContactForm({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
      } else {
        setSubmitMessage(data.message || 'Failed to send message. Please try again.');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitMessage('Network error. Please check your connection and try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [contactForm, chalet]);

  // Optimized handlers
  const closeLoginPopup = useCallback(() => setShowLoginPopup(false), []);
  const handleLoginRedirect = useCallback(() => window.location.href = '/login', []);
  const scrollToContactForm = useCallback(() => {
    contactFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const nextImage = useCallback(() => {
    if (!chalet?.images?.length) return;
    setCurrentImageIndex(prev => prev === chalet.images.length - 1 ? 0 : prev + 1);
  }, [chalet?.images?.length]);

  const prevImage = useCallback(() => {
    if (!chalet?.images?.length) return;
    setCurrentImageIndex(prev => prev === 0 ? chalet.images.length - 1 : prev - 1);
  }, [chalet?.images?.length]);

  const openLightbox = useCallback((index) => {
    setCurrentImageIndex(index);
    setShowLightbox(true);
  }, []);

  const closeLightbox = useCallback(() => setShowLightbox(false), []);

  const handleBackToListings = useCallback(() => navigate('/'), [navigate]);

  const createSlug = useCallback((title) => {
    if (!title) return '';
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }, []);

  // NEW: Optimized like handler for the new button
  const handleLikeClick = useCallback(async () => {
    if (!chalet?.id || isLikeLoading) return;
    
    if (!isAuthenticated || !user) {
      setShowLoginPopup(true);
      return;
    }
    
    setIsLikeLoading(true);
    const newLikedState = !isLiked;
    
    // Optimistic UI update
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    
    // Update localStorage
    let favorites = getFavoritesFromStorage();
    if (newLikedState) {
      if (!favorites.includes(chalet.id.toString())) {
        favorites.push(chalet.id.toString());
      }
    } else {
      favorites = favorites.filter(favId => favId !== chalet.id.toString());
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { chaletId: chalet.id.toString(), isLiked: newLikedState }
    }));
    
    try {
      const apiUrl = newLikedState 
        ? `${process.env.REACT_APP_API_BASE_URL}/add_to_favorites.php` 
        : `${process.env.REACT_APP_API_BASE_URL}/remove_from_favorites.php`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chaletId: chalet.id }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        if (data.message === 'User not logged in') {
          setShowLoginPopup(true);
        }
        // Revert optimistic update
        setIsLiked(!newLikedState);
        setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
    } finally {
      setIsLikeLoading(false);
    }
  }, [chalet?.id, isLiked, isLikeLoading, isAuthenticated, user, getFavoritesFromStorage]);

  // Memoized display values
  const displayValues = useMemo(() => {
    if (!chalet) return {};
    
    return {
      price: chalet.price ? 
        (typeof chalet.price === 'string' && chalet.price.includes('₣') ? 
          chalet.price : `₣ ${Number(chalet.price).toLocaleString()}`) : 
        'Price on request',
      sqft: chalet.sqft ? chalet.sqft.toLocaleString() : 'N/A',
      beds: chalet.beds || 1,
      baths: chalet.baths || 1,
      availability: chalet.availability || 'Contact for details',
      type: chalet.type || 'Chalet',
      yearBuilt: chalet.yearBuilt || 'N/A',
      floors: chalet.floors || '1'
    };
  }, [chalet]);

  // Memoized grouped amenities
  const groupedAmenities = useMemo(() => {
    if (!chalet?.amenities?.length) return {};
    
    const categoryNames = {
      'connectivity': 'Connectivity',
      'comfort': 'Comfort & Climate',
      'kitchen': 'Kitchen & Dining',
      'entertainment': 'Entertainment',
      'recreation': 'Recreation',
      'outdoor': 'Outdoor Spaces',
      'services': 'Services',
      'wellness': 'Wellness & Spa',
      'family': 'Family & Pets',
      'general': 'General Amenities'
    };

    const grouped = chalet.amenities.reduce((acc, amenity) => {
      const category = amenity.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(amenity);
      return acc;
    }, {});

    const categoryOrder = ['comfort', 'kitchen', 'entertainment', 'recreation', 'wellness', 'outdoor', 'connectivity', 'services', 'family', 'general'];
    
    const sortedGrouped = {};
    categoryOrder.forEach(category => {
      if (grouped[category]) {
        sortedGrouped[categoryNames[category]] = grouped[category];
      }
    });

    return sortedGrouped;
  }, [chalet?.amenities]);

  // Effects
  useEffect(() => {
    if (chalet) {
      setLikesCount(chalet.likes_count || 0);
      setIsLiked(checkIfLiked());
    }
  }, [chalet, checkIfLiked]);

  // Initialize contact form message when chalet loads
  useEffect(() => {
    if (chalet && !contactForm.message) {
      setContactForm(prev => ({
        ...prev,
        message: `I'm interested in ${chalet.title}. Please provide more information about availability and pricing.`
      }));
    }
  }, [chalet, contactForm.message]);

  // Optimized server sync
  useEffect(() => {
    if (!chalet?.id || !isAuthenticated) return;

    const syncTimer = setTimeout(async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/check_is_favorite.php`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chaletId: chalet.id }),
        });
        
        const data = await response.json();
        
        if (data.success && data.isFavorite !== isLiked) {
          setIsLiked(data.isFavorite);
          // Update localStorage to match server
          const favorites = getFavoritesFromStorage();
          if (data.isFavorite && !favorites.includes(chalet.id.toString())) {
            localStorage.setItem('favorites', JSON.stringify([...favorites, chalet.id.toString()]));
          } else if (!data.isFavorite && favorites.includes(chalet.id.toString())) {
            localStorage.setItem('favorites', JSON.stringify(favorites.filter(favId => favId !== chalet.id.toString())));
          }
        }
      } catch (err) {
        // Silently fail
      }
    }, 1000); // Delay to reduce initial load impact

    return () => clearTimeout(syncTimer);
  }, [chalet?.id, isAuthenticated, isLiked, getFavoritesFromStorage]);

  // Data fetching
  useEffect(() => {
    const fetchChaletData = async () => {
      try {
        setLoading(true);
        let apiUrl;
        if (propertyIdFromState) {
          apiUrl = `${process.env.REACT_APP_API_BASE_URL}/get_chalet.php?id=${propertyIdFromState}`;
        } else {
          apiUrl = `${process.env.REACT_APP_API_BASE_URL}/get_chalet_by_slug.php?slug=${slug}`;
        }
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          mode: 'cors',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        
        // Process images
        if (data.images && Array.isArray(data.images)) {
          data.images = data.images.map(img => formatImageUrl(img));
        } else if (data.main_image) {
          data.images = [formatImageUrl(data.main_image)];
        } else {
          data.images = ["/placeholder.jpg"];
        }
        
        // Process features
        if (data.features) {
          data.features = data.features.map(feature => ({
            ...feature,
            iconComponent: getIconComponent(feature.icon)
          }));
        } else {
          data.features = [];
        }
        
        // Process amenities
        if (data.amenities) {
          if (typeof data.amenities === 'string') {
            data.amenities = data.amenities.split(',').map(item => item.trim());
          }
          
          data.amenities = data.amenities.map(amenity => {
            const amenityData = getAmenityWithIcon(amenity);
            return {
              name: amenity,
              icon: amenityData.icon,
              category: amenityData.category
            };
          });
        } else {
          data.amenities = [];
        }
        
        setChalet(data);
      } catch (err) {
        setError(`Error loading chalet details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchChaletData();
  }, [slug, propertyIdFromState, getIconComponent, getAmenityWithIcon]);

  // Handle image loading
  const handleImageLoad = useCallback((index) => {
    setImagesLoaded(prev => new Set([...prev, index]));
  }, []);

  // Slug correction
  useEffect(() => {
    if (chalet && chalet.title) {
      const correctSlug = createSlug(chalet.title);
      if (slug !== correctSlug) {
        navigate(`/chalet/${correctSlug}`, { 
          replace: true,
          state: { propertyId: chalet.id }
        });
      }
    }
  }, [chalet, navigate, slug, createSlug]);

  if (loading) {
    return (
      <div className="chalet-detail-page">
        <Navbar />
        <div className="loading-container">Loading chalet details...</div>
        <Footer />
      </div>
    );
  }
  
  if (error && !chalet) {
    return (
      <div className="chalet-detail-page">
        <Navbar />
        <div className="error-container">
          <p>{error}</p>
          <button className="back-button" onClick={handleBackToListings}>Back to Listings</button>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!chalet) {
    return (
      <div className="chalet-detail-page">
        <Navbar />
        <div className="error-container">
          <p>Chalet not found.</p>
          <button className="back-button" onClick={handleBackToListings}>Back to Listings</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="chalet-detail-page">
      <Navbar />
      
      <main className="chalet-container">
        <div className="chalet-gallery">
          <div className="main-image">
            {!imagesLoaded.has(currentImageIndex) && (
              <div className="image-placeholder">Loading...</div>
            )}
            <img 
              src={chalet.images[currentImageIndex]} 
              alt={chalet.title} 
              onClick={() => openLightbox(currentImageIndex)}
              onLoad={() => handleImageLoad(currentImageIndex)}
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "/placeholder.jpg";
                handleImageLoad(currentImageIndex);
              }}
              style={{ opacity: imagesLoaded.has(currentImageIndex) ? 1 : 0 }}
            />
            <button className="nav-button left" onClick={prevImage}>
              <FiChevronLeft />
            </button>
            <button className="nav-button right" onClick={nextImage}>
              <FiChevronRight />
            </button>
          </div>
          <div className="thumbnail-grid">
            {chalet.images.slice(0, 3).map((img, index) => (
              <div 
                key={index} 
                className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img 
                  src={img} 
                  alt={`${chalet.title} ${index + 1}`} 
                  onClick={() => openLightbox(index)}
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "/placeholder.jpg";
                  }}
                />
              </div>
            ))}
            {chalet.images.length > 4 && (
              <div className="thumbnail more-images" onClick={() => openLightbox(4)}>
                <div className="more-count">+{chalet.images.length - 4}</div>
                <img 
                  src={chalet.images[4]} 
                  alt="More images"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "/placeholder.jpg";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {showLightbox && (
          <div className="lightbox" onClick={closeLightbox}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeLightbox}>
                <FiX />
              </button>
              <img 
                src={chalet.images[currentImageIndex]} 
                alt={chalet.title}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "/placeholder.jpg";
                }}
              />
              <button className="nav-button left" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <FiChevronLeft />
              </button>
              <button className="nav-button right" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <FiChevronRight />
              </button>
              <div className="image-counter">
                {currentImageIndex + 1} / {chalet.images.length}
              </div>
            </div>
          </div>
        )}

        <div className="chalet-content">
          <div className="chalet-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h1>{chalet.title}</h1>
              </div>
              
              {/* Like button on the right side */}
              <NewLikeButton
                isLiked={isLiked}
                isLoading={isLikeLoading}
                onClick={handleLikeClick}
                disabled={isLikeLoading}
              />
            </div>
            
            {/* Location and rating badges under the title */}
            <div className="chalet-badges">
              <div className="location">
                <FiMapPin /> {chalet.city}, {chalet.canton || 'Switzerland'}
              </div>
              <div className="rating">
                <FiHeart /> 
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </div>
            </div>
          </div>

          <div className="price-section">
            <div className="price">
              <span className="main-price">{displayValues.price}</span>
            </div>
            <div className={`status ${chalet.status ? chalet.status.toLowerCase() : 'available'}`}>
              {chalet.status || 'Available'}
            </div>
          </div>

          <div className="quick-facts">
            <div className="fact">
              <FiHome /> {displayValues.beds} bedrooms
            </div>
            <div className="fact">
              <FiDroplet /> {displayValues.baths} bathrooms
            </div>
            <div className="fact">
              <FiLayers /> {displayValues.sqft} sqft
            </div>
            <div className="fact">
              <FiUsers /> Sleeps {displayValues.beds * 2}
            </div>
            <div className="fact">
              <FiCalendar /> {displayValues.availability}
            </div>
          </div>

          <div className="description-section">
            <h2>About this chalet</h2>
            <p>{chalet.description || 'Detailed description coming soon.'}</p>
          </div>

          {chalet.features.length > 0 && (
            <div className="features-section">
              <h2>Chalet Features</h2>
              <div className="features-grid">
                {chalet.features.map((feature, index) => (
                  <div key={index} className="feature">
                    <span className="feature-icon">{feature.iconComponent}</span>
                    <span>{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chalet.amenities.length > 0 && (
            <div className="amenities-section">
              <h2>Amenities & Services</h2>
              <div className="amenities-grid">
                {chalet.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <div className="amenity-icon">
                      {amenity.icon}
                    </div>
                    <span className="amenity-name">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="location-section">
            <h2>Location</h2>
            <ChaletMapEmbed chalet={chalet} />
          </div>

          <div className="contact-section" ref={contactFormRef}>
            <h2>Contact for more information</h2>
            
            {submitMessage && (
              <div className={`submit-message ${submitStatus}`}>
                {submitMessage}
              </div>
            )}
            
            <form className="contact-form" onSubmit={handleContactFormSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactFormChange}
                  required 
                  disabled={isSubmitting}
                  placeholder="Your full name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactFormChange}
                  required 
                  disabled={isSubmitting}
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone"
                  value={contactForm.phone}
                  onChange={handleContactFormChange}
                  disabled={isSubmitting}
                  placeholder="+41 XX XXX XX XX"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea 
                  id="message" 
                  name="message"
                  rows="4" 
                  value={contactForm.message}
                  onChange={handleContactFormChange}
                  required
                  disabled={isSubmitting}
                  placeholder={`I'm interested in ${chalet?.title || 'this property'}. Please provide more information about availability and pricing.`}
                />
              </div>
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send Inquiry'
                )}
              </button>
            </form>
          </div>
        </div>

        <aside className="booking-sidebar">
          <div className="booking-card">
            <h3>Make an Inquiry</h3>
            <div className="price-display">
              <span className="main-price">{displayValues.price}</span>
            </div>
            
            <div className="availability">
              <FiCalendar /> Available: {displayValues.availability}
            </div>
            
            <div className="likes-info">
              <FiHeart /> {likesCount} {likesCount === 1 ? 'person likes' : 'people like'} this chalet
            </div>
            
            <button className="book-now-btn" onClick={scrollToContactForm}>
              Book Now
            </button>
            
 
            <div className="property-facts">
              <div className="fact">
                <FiHome /> {displayValues.type}
              </div>
              <div className="fact">
                <FiUsers /> Sleeps {displayValues.beds * 2}
              </div>
              <div className="fact">
                <FiLayers /> {displayValues.sqft} sqft
              </div>
              <div className="fact">
                Built in {displayValues.yearBuilt}
              </div>
              <div className="fact">
                {displayValues.floors} floors
              </div>
            </div>
          </div>
        </aside>

        {showLoginPopup && (
          <div className="login-popup-overlay" onClick={closeLoginPopup}>
            <div className="login-popup" onClick={(e) => e.stopPropagation()}>
              <div className="login-popup-header">
                <h3>Login Required</h3>
                <button className="close-popup" onClick={closeLoginPopup}>×</button>
              </div>
              <div className="login-popup-content">
                <FiHeart className="popup-heart-icon" />
                <p>You need to be logged in to add chalets to your favorites.</p>
                <div className="login-popup-actions">
                  <button className="login-btn" onClick={handleLoginRedirect}>Login Now</button>
                  <button className="cancel-btn" onClick={closeLoginPopup}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ChaletDetailPage;