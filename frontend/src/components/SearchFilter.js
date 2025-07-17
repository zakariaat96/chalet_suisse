// SearchFilter.jsx
import React, { useState, useEffect, useContext } from 'react';
import '../styles/SearchFilter.css';
// Import AuthContext - adjust the path to match your project structure
import { useAuth } from '../contexts/AuthContext'; 

const SearchFilter = ({ properties, setFilteredProperties, initialSearchTerm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sortBy, setSortBy] = useState('default');
  
  // Get user from context (if exists)
  // If you don't have AuthContext, you can modify this to get user info another way
  const { user } = useAuth();

  // Set initial search term from props
  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      // Immediately apply the filter if an initial search term exists
      handleFilter(initialSearchTerm);
    }
  }, [initialSearchTerm, properties]);

  // Get unique locations for the dropdown
  const uniqueLocations = [...new Set(properties
    .map(prop => prop.location || prop.city)
    .filter(loc => loc)
    .sort()
  )];

  // Format price as number with commas
  const formatPrice = (price) => {
    if (!price) return '';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Parse user-entered price, removing non-numeric characters
  const parseUserPrice = (price) => {
    if (!price) return '';
    return price.replace(/[^\d]/g, '');
  };

  // Modified handleFilter to save search query to database
  const handleFilter = async (termToFilter = searchTerm) => {
    let filtered = [...properties];

    // Filter by search term (property name, location, description)
    if (termToFilter) {
      const searchLower = termToFilter.toLowerCase();
      filtered = filtered.filter(prop => 
        (prop.title && prop.title.toLowerCase().includes(searchLower)) || 
        (prop.location && prop.location.toLowerCase().includes(searchLower)) ||
        (prop.description && prop.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by location
    if (location) {
      filtered = filtered.filter(prop => 
        (prop.location && prop.location === location) || 
        (prop.city && prop.city === location)
      );
    }

    // Filter by price range
    if (minPrice) {
      filtered = filtered.filter(prop => {
        const propPrice = parseFloat(prop.price);
        return !isNaN(propPrice) && propPrice >= parseFloat(minPrice);
      });
    }
    
    if (maxPrice) {
      filtered = filtered.filter(prop => {
        const propPrice = parseFloat(prop.price);
        return !isNaN(propPrice) && propPrice <= parseFloat(maxPrice);
      });
    }

    // Filter by bedrooms (using 'beds' from database)
    if (bedrooms) {
      filtered = filtered.filter(prop => {
        const propBedrooms = parseInt(prop.beds || prop.bedrooms || 0);
        return propBedrooms >= parseInt(bedrooms);
      });
    }

    // Filter by bathrooms (using 'baths' from database)
    if (bathrooms) {
      filtered = filtered.filter(prop => {
        const propBathrooms = parseInt(prop.baths || prop.bathrooms || 0);
        return propBathrooms >= parseInt(bathrooms);
      });
    }

    // Sort filtered properties
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        break;
      case 'price-desc':
        filtered.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        break;
      case 'newest':
        // FIXED: Sort by created_at field from database
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'oldest':
        // FIXED: Sort by created_at field from database
        filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        break;
      case 'most-liked':
        // Option 1: If API includes likes_count from JOIN with user_favorites
        filtered.sort((a, b) => parseInt(b.likes_count || 0) - parseInt(a.likes_count || 0));
        
        // Option 2: Temporary - Sort by days_on_market (less days = more popular)
        // filtered.sort((a, b) => parseInt(a.days_on_market || 999) - parseInt(b.days_on_market || 999));
        
        // Option 3: Temporary - Sort by newest (recent = more popular)
        // filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'bedrooms-asc':
        filtered.sort((a, b) => {
          const aBedrooms = parseInt(a.beds || a.bedrooms || 0);
          const bBedrooms = parseInt(b.beds || b.bedrooms || 0);
          return aBedrooms - bBedrooms;
        });
        break;
      case 'bedrooms-desc':
        filtered.sort((a, b) => {
          const aBedrooms = parseInt(a.beds || a.bedrooms || 0);
          const bBedrooms = parseInt(b.beds || b.bedrooms || 0);
          return bBedrooms - aBedrooms;
        });
        break;
      case 'bathrooms-asc':
        filtered.sort((a, b) => {
          const aBathrooms = parseInt(a.baths || a.bathrooms || 0);
          const bBathrooms = parseInt(b.baths || b.bathrooms || 0);
          return aBathrooms - bBathrooms;
        });
        break;
      case 'bathrooms-desc':
        filtered.sort((a, b) => {
          const aBathrooms = parseInt(a.baths || a.bathrooms || 0);
          const bBathrooms = parseInt(b.baths || b.bathrooms || 0);
          return bBathrooms - aBathrooms;
        });
        break;
      case 'a-z':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'z-a':
        filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      default:
        break;
    }

    // Set filtered properties in parent component
    setFilteredProperties(filtered);
    
    // Save search query to database
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/save_search_query.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session tracking
        body: JSON.stringify({
          user_id: user?.id || null, // User ID if logged in, null otherwise
          search_term: termToFilter,
          location: location,
          min_price: minPrice,
          max_price: maxPrice,
          bedrooms: bedrooms,
          bathrooms: bathrooms,
          sort_by: sortBy
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('Error saving search query:', data.message);
      }
    } catch (error) {
      console.error('Failed to save search query:', error);
    }
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setBathrooms('');
    setSortBy('default');
    setFilteredProperties(properties);
  };

  // Price dropdown options
  const minPriceOptions = [
    { value: '', label: 'Min Price' },
    { value: '500000', label: '500,000 ₣' },
    { value: '1000000', label: '1,000,000 ₣' },
    { value: '2000000', label: '2,000,000 ₣' },
    { value: '3000000', label: '3,000,000 ₣' },
    { value: '5000000', label: '5,000,000 ₣' },
    { value: '7000000', label: '7,000,000 ₣' },
    { value: '10000000', label: '10,000,000 ₣' }
  ];

  const maxPriceOptions = [
    { value: '', label: 'Max Price' },
    { value: '1000000', label: '1,000,000 ₣' },
    { value: '2000000', label: '2,000,000 ₣' },
    { value: '3000000', label: '3,000,000 ₣' },
    { value: '5000000', label: '5,000,000 ₣' },
    { value: '7000000', label: '7,000,000 ₣' },
    { value: '10000000', label: '10,000,000 ₣' },
    { value: '15000000', label: '15,000,000 ₣' },
    { value: '20000000', label: '20,000,000 ₣' },
    { value: '30000000', label: '30,000,000 ₣' }
  ];

  return (
    <div className="property-filters">
      {/* First row - Search input */}
      <div className="filter-row">
        <input
          type="text"
          placeholder="Search chalets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      {/* Second row - All filters in one row */}
      <div className="filter-row filters-container">
        <div className="filters-group">
          {/* Location filter */}
          <div className="filter-field">
            <select 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((loc, index) => (
                <option key={index} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          
          {/* Min price field - With both manual input and dropdown styling */}
          <div className="filter-field price-field">
            <input
              type="text"
              placeholder="Min Price"
              value={formatPrice(minPrice)}
              onChange={(e) => setMinPrice(parseUserPrice(e.target.value))}
              className="filter-select price-input"
            />
            <select 
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setMinPrice(e.target.value);
                }
              }}
              className="price-select"
            >
              <option value="">▼</option>
              {minPriceOptions.slice(1).map((option, index) => (
                <option key={index} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Max price field - With both manual input and dropdown styling */}
          <div className="filter-field price-field">
            <input
              type="text"
              placeholder="Max Price"
              value={formatPrice(maxPrice)}
              onChange={(e) => setMaxPrice(parseUserPrice(e.target.value))}
              className="filter-select price-input"
            />
            <select 
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setMaxPrice(e.target.value);
                }
              }}
              className="price-select"
            >
              <option value="">▼</option>
              {maxPriceOptions.slice(1).map((option, index) => (
                <option key={index} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Bedrooms filter - With both manual input and dropdown */}
          <div className="filter-field price-field">
            <input
              type="text"
              placeholder="Bedrooms"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value.replace(/[^\d]/g, ''))}
              className="filter-select price-input"
            />
            <select 
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setBedrooms(e.target.value);
                }
              }}
              className="price-select"
            >
              <option value="">▼</option>
              <option value="1">1+ Bedroom</option>
              <option value="2">2+ Bedrooms</option>
              <option value="3">3+ Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
              <option value="5">5+ Bedrooms</option>
              <option value="6">6+ Bedrooms</option>
              <option value="7">7+ Bedrooms</option>
              <option value="8">8+ Bedrooms</option>
            </select>
          </div>
          
          {/* Bathrooms filter - With both manual input and dropdown */}
          <div className="filter-field price-field">
            <input
              type="text"
              placeholder="Bathrooms"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value.replace(/[^\d]/g, ''))}
              className="filter-select price-input"
            />
            <select 
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setBathrooms(e.target.value);
                }
              }}
              className="price-select"
            >
              <option value="">▼</option>
              <option value="1">1+ Bathroom</option>
              <option value="2">2+ Bathrooms</option>
              <option value="3">3+ Bathrooms</option>
              <option value="4">4+ Bathrooms</option>
              <option value="5">5+ Bathrooms</option>
              <option value="6">6+ Bathrooms</option>
              <option value="7">7+ Bathrooms</option>
            </select>
          </div>
          
          {/* Sort by filter */}
          <div className="filter-field">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="default">Sort By</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-liked">Most Popular</option>
              <option value="bedrooms-asc">Bedrooms: Low to High</option>
              <option value="bedrooms-desc">Bedrooms: High to Low</option>
              <option value="bathrooms-asc">Bathrooms: Low to High</option>
              <option value="bathrooms-desc">Bathrooms: High to Low</option>
            </select>
          </div>
        </div>

        <div className="filter-buttons">
          <button onClick={() => handleFilter()} className="filter-btn apply-btn">Apply</button>
          <button onClick={clearFilters} className="filter-btn clear-btn">Clear</button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;