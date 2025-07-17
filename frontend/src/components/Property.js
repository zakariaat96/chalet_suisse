import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiHome, FiDroplet, FiHeart } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Property.css';

const Property = memo(({ property, variant = "default", onFavoriteChange }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  const propertyData = property || {};
  
  const {
    id,
    title,
    price,
    main_image,
    city,
    bedrooms,
    bathrooms,
    status
  } = propertyData;

  // Memoized slug creation
  const slug = React.useMemo(() => {
    if (!title) return '';
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }, [title]);

  // Memoized values to prevent recalculation
  const displayValues = React.useMemo(() => ({
    bedrooms: bedrooms || 'N/A',
    bathrooms: bathrooms || 'N/A',
    price: typeof price === 'number' 
      ? price.toLocaleString() 
      : Number(price) ? Number(price).toLocaleString() : 'Price on request'
  }), [bedrooms, bathrooms, price]);

  // Optimized image URL formatting
  const imageSrc = React.useMemo(() => {
    if (!main_image) return "/placeholder.jpg";
    if (main_image.startsWith('http://') || main_image.startsWith('https://')) {
      return main_image;
    }
    const cleanPath = main_image.startsWith('/') ? main_image.substring(1) : main_image;
    return `${process.env.REACT_APP_BASE_URL}/${cleanPath}`;
  }, [main_image]);

  // Optimized favorites management
  const getFavoritesFromStorage = useCallback(() => {
    try {
      const favorites = localStorage.getItem('favorites');
      return favorites ? JSON.parse(favorites) : [];
    } catch (e) {
      console.error('Error parsing favorites from localStorage:', e);
      return [];
    }
  }, []);

  const checkIfLiked = useCallback(() => {
    if (!id || !isAuthenticated) return false;
    const favorites = getFavoritesFromStorage();
    return Array.isArray(favorites) && favorites.includes(id.toString());
  }, [id, isAuthenticated, getFavoritesFromStorage]);

  // Throttled server check to reduce API calls
  const checkServerStatus = useCallback(() => {
    if (!id || !isAuthenticated) return;
    
    fetch(`${process.env.REACT_APP_API_BASE_URL}/check_is_favorite.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chaletId: id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.isFavorite !== isLiked) {
          setIsLiked(data.isFavorite);
          
          const favorites = getFavoritesFromStorage();
          if (data.isFavorite && !favorites.includes(id.toString())) {
            favorites.push(id.toString());
            localStorage.setItem('favorites', JSON.stringify(favorites));
          } else if (!data.isFavorite && favorites.includes(id.toString())) {
            const updatedFavorites = favorites.filter(favId => favId !== id.toString());
            localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
          }
        }
      })
      .catch(err => {
        // Silently fail to reduce console noise
      });
  }, [id, isAuthenticated, isLiked, getFavoritesFromStorage]);

  // Reduced effect frequency
  useEffect(() => {
    setIsLiked(checkIfLiked());
    
    // Only check server status on mount, not on every update
    if (isAuthenticated) {
      // Delay server check to reduce initial load impact
      const timer = setTimeout(checkServerStatus, 1000);
      return () => clearTimeout(timer);
    }
  }, [id, isAuthenticated]); // Removed isLiked from dependencies

  // Optimized storage event handler
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLiked(checkIfLiked());
    };
    
    const handleFavoritesChange = (e) => {
      if (e.detail && e.detail.chaletId === id) {
        setIsLiked(e.detail.isLiked);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesChanged', handleFavoritesChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleFavoritesChange);
    };
  }, [id, checkIfLiked]);
  
  // Optimized like handler with debouncing
  const handleLikeClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!id || isLoading) return;
    
    if (!isAuthenticated || !user) {
      setShowLoginPopup(true);
      return;
    }
    
    setIsLoading(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Update localStorage immediately
    let favorites = getFavoritesFromStorage();
    
    if (newLikedState) {
      if (!favorites.includes(id.toString())) {
        favorites.push(id.toString());
      }
    } else {
      favorites = favorites.filter(favId => favId !== id.toString());
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { chaletId: id.toString(), isLiked: newLikedState }
    }));
    
    // Server update with error handling
    const apiUrl = newLikedState 
      ? `${process.env.REACT_APP_API_BASE_URL}/add_to_favorites.php ` 
      : `${process.env.REACT_APP_API_BASE_URL}/remove_from_favorites.php `;
    
    fetch(apiUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chaletId: id }),
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success && data.message === 'User not logged in') {
          setShowLoginPopup(true);
          setIsLiked(!newLikedState);
          // Revert localStorage
          const revertFavorites = getFavoritesFromStorage();
          if (newLikedState) {
            const updatedFavorites = revertFavorites.filter(favId => favId !== id.toString());
            localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
          } else {
            if (!revertFavorites.includes(id.toString())) {
              revertFavorites.push(id.toString());
              localStorage.setItem('favorites', JSON.stringify(revertFavorites));
            }
          }
        }
      })
      .catch(() => {
        // Server error - keep local changes
      })
      .finally(() => {
        setIsLoading(false);
      });
    
    if (onFavoriteChange) {
      onFavoriteChange(id, newLikedState);
    }
  }, [id, isLiked, isLoading, isAuthenticated, user, getFavoritesFromStorage, onFavoriteChange]);

  const closeLoginPopup = useCallback(() => {
    setShowLoginPopup(false);
  }, []);

  const handleLoginRedirect = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  return (
    <>
      <Link 
        to={`/chalet/${slug}`} 
        state={{ propertyId: id }}
        className={`property-card ${variant}`}
      >
        <div className="property-image-container">
          {!imageLoaded && <div className="image-placeholder">Loading...</div>}
          <img 
            src={imageSrc} 
            alt={title || "Swiss Chalet"} 
            className={`property-image ${imageLoaded ? 'loaded' : ''}`}
            loading="lazy" 
            onLoad={handleImageLoad}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder.jpg";
              setImageLoaded(true);
            }}
          />
          {status && <div className="property-badge">{status}</div>}
          
          <div 
            className={`like-button ${isLiked ? 'liked' : ''} ${isLoading ? 'loading' : ''} ${!isAuthenticated ? 'not-authenticated' : ''}`}
            onClick={handleLikeClick}
            title={
              !isAuthenticated 
                ? "Login to add to favorites" 
                : isLiked 
                  ? "Remove from favorites" 
                  : "Add to favorites"
            }
          >
            <FiHeart />
          </div>
        </div>
        
        <div className="property-details">
          <h3 className="property-title">{title || "Beautiful Swiss Chalet"}</h3>
          <div className="property-price">{displayValues.price} ₣</div>
          
          {city && (
            <div className="property-location">
              <FiMapPin className="property-icon" /> {city}
            </div>
          )}
          
          <div className="property-meta">
            <span className="property-feature">
              <FiHome className="property-icon" /> {displayValues.bedrooms} beds
            </span>
            <span className="property-feature">
              <FiDroplet className="property-icon" /> {displayValues.bathrooms} baths
            </span>
          </div>
        </div>
      </Link>

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
    </>
  );
});

Property.displayName = 'Property';

export default Property;