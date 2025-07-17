import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import '../styles/PropertyFilters.css';

const PropertyFilters = () => {
  // Local state only for UI demonstration
  const [filters, setFilters] = useState({
    searchTerm: '',
    priceRange: [0, 5000000],
    bedrooms: 0,
    bathrooms: 0
  });

  const handleChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
   // console.log('Filters changed:', { ...filters, [name]: value });
  };

  return (
    <div className="property-filters">
      <div className="search-bar">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by location or chalet name..."
          value={filters.searchTerm}
          onChange={(e) => handleChange('searchTerm', e.target.value)}
        />
      </div>
      
      <div className="filter-options">
        <div className="filter-group">
          <label>Price Range</label>
          <div className="price-range">
            <span>₣ {filters.priceRange[0].toLocaleString()}</span>
            <input
              type="range"
              min="0"
              max="5000000"
              step="100000"
              value={filters.priceRange[1]}
              onChange={(e) => handleChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
            />
            <span>₣ {filters.priceRange[1].toLocaleString()}</span>
          </div>
        </div>
        
        <div className="filter-group">
          <label>Bedrooms</label>
          <div className="bed-bath-selector">
            {[0, 1, 2, 3, 4, 5].map(num => (
              <button
                key={`bed-${num}`}
                className={filters.bedrooms === num ? 'active' : ''}
                onClick={() => handleChange('bedrooms', num)}
              >
                {num === 0 ? 'Any' : `${num}+`}
              </button>
            ))}
          </div>
        </div>
        
        <div className="filter-group">
          <label>Bathrooms</label>
          <div className="bed-bath-selector">
            {[0, 1, 2, 3, 4].map(num => (
              <button
                key={`bath-${num}`}
                className={filters.bathrooms === num ? 'active' : ''}
                onClick={() => handleChange('bathrooms', num)}
              >
                {num === 0 ? 'Any' : `${num}+`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyFilters;