import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Property from '../components/Property';
import '../styles/AllPropertypage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchFilter from '../components/SearchFilter';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

const AllPropertiesPage = () => {
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialSearchTerm, setInitialSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [propertiesPerPage] = useState(8);

  // Debounced update to prevent excessive re-renders
  const updateFilteredProperties = useCallback((newFiltered) => {
    setFilteredProperties(newFiltered);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchParam = queryParams.get('search');
    if (searchParam) {
      setInitialSearchTerm(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        let data = [];
        let propertiesWithLikes = [];
        
        // First: Try to get properties with likes from property_manage.php
        try {
          const likesApiUrl = `${process.env.REACT_APP_API_BASE_URL}/property_manage.php?view=active`;
          const likesResponse = await fetch(likesApiUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (likesResponse.ok) {
            const likesData = await likesResponse.json();
            if (Array.isArray(likesData)) {
              propertiesWithLikes = likesData;
            //  console.log('Successfully fetched chalets with likes data');
            }
          }
        } catch (error) {
          console.warn('Could not fetch likes data from property_manage.php:', error);
        }
        
        // Second: Get all properties from get_all_chalets.php
        const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/get_all_chalets.php`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        data = await response.json();
        
        if (Array.isArray(data)) {
          // Merge data: Use get_all_chalets.php as base, add likes_count from property_manage.php
          const optimizedData = data.map(property => {
            // Find matching property with likes data
            const propertyWithLikes = propertiesWithLikes.find(p => p.id === property.id);
            
            return {
              id: property.id,
              title: property.title,
              price: property.price,
              main_image: property.main_image,
              city: property.city,
              // Handle both possible field names for bedrooms/bathrooms
              bedrooms: property.beds || property.bedrooms || property.bedroom_count || property.bed_count,
              bathrooms: property.baths || property.bathrooms || property.bathroom_count || property.bath_count,
              status: property.status,
              description: property.description,
              // Use created_at from either API
              created_at: property.created_at || propertyWithLikes?.created_at,
              // Use likes_count from property_manage.php if available
              likes_count: parseInt(propertyWithLikes?.likes_count || property.likes_count || 0)
            };
          });
          
       //   console.log('Sample chalet with merged data:', optimizedData[0]);
          
          setProperties(optimizedData);
          
          if (initialSearchTerm) {
            const searchLower = initialSearchTerm.toLowerCase();
            const filtered = optimizedData.filter(property => 
              property.title?.toLowerCase().includes(searchLower) || 
              property.city?.toLowerCase().includes(searchLower) ||
              property.description?.toLowerCase().includes(searchLower)
            );
            setFilteredProperties(filtered);
          } else {
            setFilteredProperties(optimizedData);
          }
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error('Error fetching chalets:', err);
        setError(`Error loading chalets: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [initialSearchTerm]);

  // Memoized pagination calculations to prevent unnecessary recalculations
  const paginationData = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredProperties.length / propertiesPerPage));
    const indexOfLastProperty = currentPage * propertiesPerPage;
    const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
    const currentProperties = filteredProperties.slice(indexOfFirstProperty, indexOfLastProperty);
    
    return {
      totalPages,
      indexOfLastProperty,
      indexOfFirstProperty,
      currentProperties
    };
  }, [filteredProperties, currentPage, propertiesPerPage]);

  // Optimized page navigation handlers
  const goToPage = useCallback((pageNumber) => {
    const newPage = Math.max(1, Math.min(pageNumber, paginationData.totalPages));
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      // Smooth scroll to top without blocking
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }, [currentPage, paginationData.totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage = useCallback(() => goToPage(paginationData.totalPages), [goToPage, paginationData.totalPages]);

  // Memoized page numbers generation
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const { totalPages } = paginationData;
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
      const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;

      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [currentPage, paginationData.totalPages]);

  if (loading) return <div className="loading">Loading Chalets...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="all-properties-page">
      <Navbar />
      
      <div className="property-listings">
        <div className="listings-header">
          <SearchFilter 
            properties={properties} 
            setFilteredProperties={updateFilteredProperties}
            initialSearchTerm={initialSearchTerm}
          />
          
          <p className="properties-count">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'chalet' : 'chalets'} found
            {paginationData.totalPages > 1 && (
              <span className="pagination-info-inline"> (Page {currentPage} of {paginationData.totalPages})</span>
            )}
          </p>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="no-results">No chalets match your search criteria. Try adjusting your filters.</div>
        ) : (
          <>
            <div className="properties-container">
              <div className="properties-slider">
                {paginationData.currentProperties.map(property => (
                  <Property 
                    key={`property-${property.id}`}
                    property={property}
                    variant="grid" 
                  />
                ))}
              </div>
            </div>

            {/* Pagination Controls */}
            {paginationData.totalPages > 1 && (
              <div className="pagination-controls">
                <button 
                  className="page-btn first-page"
                  onClick={firstPage}
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  <FiChevronsLeft />
                </button>
                
                <button 
                  className="page-btn prev-page"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  <FiChevronLeft />
                </button>
                
                <div className="pagination-pages">
                  {pageNumbers.map(number => (
                    <button
                      key={`page-btn-${number}`}
                      onClick={() => goToPage(number)}
                      className={`page-btn page-number ${currentPage === number ? 'active' : ''}`}
                    >
                      {number}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="page-btn next-page"
                  onClick={nextPage}
                  disabled={currentPage === paginationData.totalPages}
                  title="Next Page"
                >
                  <FiChevronRight />
                </button>
                
                <button 
                  className="page-btn last-page"
                  onClick={lastPage}
                  disabled={currentPage === paginationData.totalPages}
                  title="Last Page"
                >
                  <FiChevronsRight />
                </button>
              </div>
            )}
            
            <div className="pagination-info">
              Showing {paginationData.indexOfFirstProperty + 1}-{Math.min(paginationData.indexOfLastProperty, filteredProperties.length)} of {filteredProperties.length} chalets
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AllPropertiesPage;