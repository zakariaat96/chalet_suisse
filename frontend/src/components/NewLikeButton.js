import React, { useState, useCallback } from 'react';
import { FiHeart } from 'react-icons/fi';

const NewLikeButton = ({ 
  isLiked = false, 
  isLoading = false, 
  onClick, 
  disabled = false,
  className = "",
  ariaLabel 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback((e) => {
    if (disabled || isLoading) return;
    
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    
    if (onClick) {
      onClick(e);
    }
  }, [disabled, isLoading, onClick]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  }, [handleClick]);

  const buttonClasses = [
    'new-like-button',
    isLiked ? 'liked' : '',
    isPressed ? 'pressed' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || isLoading}
      aria-label={ariaLabel || (isLiked ? "Remove from favorites" : "Add to favorites")}
      aria-pressed={isLiked}
      type="button"
    >
      <div className="like-button-content">
        {isLoading ? (
          <>
            <div className="like-button-spinner" />
            <span className="like-button-text">Loading</span>
          </>
        ) : (
          <>
            <FiHeart className="like-button-icon" />
            <span className="like-button-text">
              {isLiked ? 'Liked' : 'Like'}
            </span>
          </>
        )}
      </div>
    </button>
  );
};

export default NewLikeButton;