import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit, FiEye, FiHeart, FiTrash2, FiPlus, FiX, FiSearch, FiRefreshCw, FiChevronDown, 
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiArchive, FiRotateCcw, FiTrash, FiHome, FiMapPin, FiUser } from 'react-icons/fi';
import axios from 'axios';
import '../styles/PropertyManagement.css';

let PropertyModal;

function PropertyManagement() {
  const navigate = useNavigate();
  
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState('active');
  const [users, setUsers] = useState([]);
  const [modalLoaded, setModalLoaded] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/property_manage.php`;

  // Function to prevent body scroll
  const disableBodyScroll = () => {
    // Store the current scroll position
    const scrollY = window.scrollY;
    
    // Apply styles to prevent scrolling
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    
    // Store scroll position for restoration
    document.body.setAttribute('data-scroll-y', scrollY.toString());
  };

  // Function to restore body scroll
  const enableBodyScroll = () => {
    // Get the stored scroll position
    const scrollY = document.body.getAttribute('data-scroll-y');
    
    // Remove the styles that prevent scrolling
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    
    // Restore scroll position
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY, 10));
      document.body.removeAttribute('data-scroll-y');
    }
  };

  // Effect to handle body scroll when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      if (isModalOpen) {
        enableBodyScroll();
      }
    };
  }, [isModalOpen]);

  // Load PropertyModal dynamically when first needed
  useEffect(() => {
    if (isModalOpen && !modalLoaded) {
      import('./PropertyModal').then((module) => {
        PropertyModal = module.default;
        setModalLoaded(true);
      }).catch((error) => {
        console.error('Error loading PropertyModal:', error);
      });
    }
  }, [isModalOpen, modalLoaded]);

  const createSlug = (title) => {
    if (!title) return '';
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  useEffect(() => {
    fetchProperties();
    fetchUsers();
  }, [viewMode]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}?view=${viewMode}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (Array.isArray(response.data)) {
        setProperties(response.data);
        setError(null);
      } else if (response.data.error) {
        setError(response.data.error);
      } else {
        setError('Unexpected response format');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Error fetching properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/get_users.php`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.users || []);
      } else {
        console.error('Failed to fetch users:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id.toString() === userId?.toString());
    return user ? user.name : 'Unknown';
  };

  useEffect(() => {
    if (!properties.length) return;
    
    let result = [...properties];
    
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(property => 
        property.title?.toLowerCase().includes(lowercasedSearch) || 
        property.city?.toLowerCase().includes(lowercasedSearch) ||
        property.canton?.toLowerCase().includes(lowercasedSearch) ||
        property.price?.toString().includes(lowercasedSearch)
      );
    }
    
    switch(sortOrder) {
      case 'price-high':
        result.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^\d.]/g, '')) : a.price;
          const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^\d.]/g, '')) : b.price;
          return priceB - priceA;
        });
        break;
      case 'price-low':
        result.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^\d.]/g, '')) : a.price;
          const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^\d.]/g, '')) : b.price;
          return priceA - priceB;
        });
        break;
      case 'name-asc':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'name-desc':
        result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'likes-desc':
        result.sort((a, b) => parseInt(b.likes_count || 0) - parseInt(a.likes_count || 0));
        break;
      case 'likes-asc':
        result.sort((a, b) => parseInt(a.likes_count || 0) - parseInt(b.likes_count || 0));
        break;
      case 'status-available':
        result = result.filter(property => property.status === 'Available');
        break;
      case 'status-pending':
        result = result.filter(property => property.status === 'Pending');
        break;
      case 'status-sold':
        result = result.filter(property => property.status === 'Sold');
        break;
      default:
        result.sort((a, b) => b.id - a.id);
        break;
    }
    
    setFilteredProperties(result);
    setCurrentPage(1);
  }, [properties, searchTerm, sortOrder, viewMode]);

  const handleEditClick = (propertyId) => {
    const property = properties.find(property => property.id === propertyId);
    if (property) {
      setCurrentProperty(property);
      setIsModalOpen(true);
    }
  };

  const handleAddClick = () => {
    setCurrentProperty(null);
    setIsModalOpen(true);
  };

  const handleViewClick = (property) => {
    const slug = createSlug(property.title);
    navigate(`/chalet/${slug}`, { 
      state: { propertyId: property.id } 
    });
  };

  const handleMoveToTrash = async (propertyId) => {
    if (window.confirm('Are you sure you want to move this property to trash?')) {
      try {
        const response = await axios.post(`${apiUrl}?action=trash`, { id: propertyId });
        
        if (response.data.success) {
          fetchProperties();
          alert('Property moved to trash successfully');
        } else if (response.data.error) {
          alert(response.data.error);
        } else {
          alert('Failed to move property to trash');
        }
      } catch (error) {
        console.error('Error moving property to trash:', error);
        alert('Error moving property to trash: ' + error.message);
      }
    }
  };
  
  const handleRestoreProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to restore this property?')) {
      try {
        const response = await axios.post(`${apiUrl}?action=restore`, { id: propertyId });
        
        if (response.data.success) {
          fetchProperties();
          alert('Property restored successfully');
        } else if (response.data.error) {
          alert(response.data.error);
        } else {
          alert('Failed to restore property');
        }
      } catch (error) {
        console.error('Error restoring property:', error);
        alert('Error restoring property: ' + error.message);
      }
    }
  };
  
  // FIXED: This function now calls the correct PHP file
  const handleDeletePermanently = async (propertyId) => {
    if (window.confirm('Are you sure you want to permanently delete this property? This action cannot be undone.')) {
      try {
        // FIXED: Call the correct PHP file that deletes from both chalets and user_favorites
        const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/delete_property_permanently.php`, { 
          id: propertyId 
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          fetchProperties();
          alert('Property permanently deleted');
        //  console.log('Deletion details:', response.data.details); // Optional: log the deletion details
        } else {
          alert(response.data.message || 'Failed to delete property');
        }
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Error deleting property: ' + error.message);
      }
    }
  };

  const handleSaveProperty = async (propertyData) => {
    try {
      let endpoint = '';
      
      if (propertyData.gallery_images && Array.isArray(propertyData.gallery_images)) {
        propertyData.gallery_images = JSON.stringify(propertyData.gallery_images);
      }
      
      if (propertyData.id) {
        endpoint = `${process.env.REACT_APP_API_BASE_URL}/update_property.php`;
      } else {
        endpoint = `${process.env.REACT_APP_API_BASE_URL}/add_property.php`;
      }
      
      const response = await axios.post(endpoint, propertyData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        fetchProperties();
        setIsModalOpen(false);
        alert(propertyData.id ? 'Property updated successfully' : 'Property added successfully');
      } else {
        const errorMessage = response.data ? response.data.message || 'Failed to save property' : 'Failed to save property';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error saving property:', error);
      
      if (error.response) {
        alert(`Error saving property: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        alert('Error: No response received from server. Please check your network connection.');
      } else {
        alert('Error saving property: ' + error.message);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
    setShowSortDropdown(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'active' ? 'trash' : 'active');
    setSearchTerm('');
    setSortOrder('newest');
    setProperties([]);
    setFilteredProperties([]);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProperties.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const firstPage = () => setCurrentPage(1);
  const lastPage = () => setCurrentPage(totalPages);

  const renderStatusBadge = (status) => {
    let className = "status ";
    
    switch(status) {
      case 'Available':
        className += "active";
        break;
      case 'Pending':
        className += "pending";
        break;
      case 'Sold':
        className += "sold";
        break;
      default:
        className += "active";
    }
    
    return (
      <span className={className}>
        {status}
      </span>
    );
  };

  const formatPrice = (price) => {
    if (!price) return '';
    
    if (typeof price === 'string' && price.includes('₣')) {
      return price;
    }
    
    return `₣ ${Number(price).toLocaleString()}`;
  };

  const showEmptyTrashMessage = viewMode === 'trash' && (!properties.length || properties.length === 0);

  return (
    <section id="properties" className="dashboard-section">
      <div className="section-header">
        <div className="user-section-title-row">
          <h2 className="user-section-title">
            <FiHome className="user-section-icon" />
            {viewMode === 'active' ? 'Property Management' : 'Property Trash'}
          </h2>
          <div className="user-header-actions">
            <button 
              className={`user-toggle-view-btn ${viewMode === 'trash' ? 'active' : ''}`} 
              onClick={toggleViewMode}
              title={viewMode === 'active' ? 'View Trash' : 'View Active Properties'}
            >
              {viewMode === 'active' ? (
                <><FiTrash2 /> View Trash</>
              ) : (
                <><FiArchive /> View Active Properties</>
              )}
            </button>
            
            {viewMode === 'active' && (
              <button className="user-add-btn" onClick={handleAddClick}>
                <FiPlus /> Add New Property
              </button>
            )}
          </div>
        </div>
        <p className="user-section-subtitle">
          {viewMode === 'active' 
            ? 'Manage all listed properties with free OpenStreetMap integration' 
            : 'View and manage deleted properties'}
        </p>
        
        {!showEmptyTrashMessage && (
          <div className="user-search-card">
            <div className="user-search-input-wrapper">
              <FiSearch className="user-search-icon" />
              <input
                type="text"
                className="user-search-input"
                placeholder="Search by title, location or price..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button className="user-clear-search-btn" onClick={clearSearch}>
                  <FiX />
                </button>
              )}
            </div>
            
            <div className="user-sort-controls">
              <div className="user-sort-dropdown-container">
                <button 
                  className="user-sort-dropdown-btn" 
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  {sortOrder === 'newest' && 'Newest First'}
                  {sortOrder === 'price-high' && 'Price (High to Low)'}
                  {sortOrder === 'price-low' && 'Price (Low to High)'}
                  {sortOrder === 'name-asc' && 'Name (A-Z)'}
                  {sortOrder === 'name-desc' && 'Name (Z-A)'}
                  {sortOrder === 'likes-desc' && 'Most Liked'}
                  {sortOrder === 'likes-asc' && 'Least Liked'}
                  {sortOrder === 'status-available' && 'Status: Available'}
                  {sortOrder === 'status-pending' && 'Status: Pending'}
                  {sortOrder === 'status-sold' && 'Status: Sold'}
                  <FiChevronDown />
                </button>
                
                {showSortDropdown && (
                  <div className="user-sort-dropdown-menu">
                    <div className="user-dropdown-section">
                      <div className="user-dropdown-section-title">Sort</div>
                      <button 
                        className={`user-sort-option ${sortOrder === 'newest' ? 'active' : ''}`}
                        onClick={() => handleSortChange('newest')}
                      >
                        Newest First
                      </button>
                      <button 
                        className={`user-sort-option ${sortOrder === 'price-high' ? 'active' : ''}`}
                        onClick={() => handleSortChange('price-high')}
                      >
                        Price (High to Low)
                      </button>
                      <button 
                        className={`user-sort-option ${sortOrder === 'price-low' ? 'active' : ''}`}
                        onClick={() => handleSortChange('price-low')}
                      >
                        Price (Low to High)
                      </button>
                      <button 
                        className={`user-sort-option ${sortOrder === 'name-asc' ? 'active' : ''}`}
                        onClick={() => handleSortChange('name-asc')}
                      >
                        Name (A-Z)
                      </button>
                      <button 
                        className={`user-sort-option ${sortOrder === 'name-desc' ? 'active' : ''}`}
                        onClick={() => handleSortChange('name-desc')}
                      >
                        Name (Z-A)
                      </button>
                      <button 
                        className={`user-sort-option ${sortOrder === 'likes-desc' ? 'active' : ''}`}
                        onClick={() => handleSortChange('likes-desc')}
                      >
                        Most Liked
                      </button>
                      <button 
                        className={`user-sort-option ${sortOrder === 'likes-asc' ? 'active' : ''}`}
                        onClick={() => handleSortChange('likes-asc')}
                      >
                        Least Liked
                      </button>
                    </div>
                    
                    <div className="user-dropdown-divider"></div>
                    
                    <div className="user-dropdown-section">
                      <div className="user-dropdown-section-title">Filter by Status</div>
                      <button 
                        className={`user-sort-option ${sortOrder === 'newest' || sortOrder === 'price-high' || sortOrder === 'price-low' || sortOrder === 'name-asc' || sortOrder === 'name-desc' ? 'active' : ''}`}
                        onClick={() => handleSortChange('newest')}
                      >
                        All Statuses
                      </button>
                      <button 
                        className={`user-sort-option ${sortOrder === 'status-available' ? 'active' : ''}`}
                        onClick={() => handleSortChange('status-available')}
                      >
                        Available Only
                      </button>
                      <button 
                        className={`user-sort-option ${sortOrder === 'status-pending' ? 'active' : ''}`}
                        onClick={() => handleSortChange('status-pending')}
                      >
                        Pending Only
                      </button>
                      <button 
                        className={`user-sort-option ${sortOrder === 'status-sold' ? 'active' : ''}`}
                        onClick={() => handleSortChange('status-sold')}
                      >
                        Sold Only
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button className="user-refresh-btn" onClick={fetchProperties} title="Refresh Properties">
                <FiRefreshCw />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="section-content">
        {loading ? (
          <div className="user-loading-spinner">Loading properties...</div>
        ) : error ? (
          <div className="user-error-message">{error}</div>
        ) : showEmptyTrashMessage ? (
          <div className="user-no-results">The trash is empty.</div>
        ) : filteredProperties.length === 0 ? (
          <div className="user-no-results">
            {viewMode === 'active' ? (
              searchTerm || sortOrder.startsWith('status-') ? 
                'No properties match your search criteria.' : 
                'No properties found.'
            ) : (
              'The trash is empty.'
            )}
          </div>
        ) : (
          <>
            {/* Desktop/Tablet Table View */}
            <div className="user-table-container">
              <table className="user-data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Owner</th>
                    <th>Likes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(property => (
                    <tr key={property.id}>
                      <td>{property.id}</td>
                      <td>{property.title}</td>
                      <td>{property.city}, {property.canton}</td>
                      <td>{formatPrice(property.price)}</td>
                      <td>{getUserName(property.user_id)}</td>
                      <td>
                        <span className="property-likes-badge">
                          <FiHeart className="property-heart-icon" /> {property.likes_count || 0}
                        </span>
                      </td>
                      <td>{renderStatusBadge(property.status)}</td>
                      <td>
                        <div className="user-action-buttons">
                          {viewMode === 'active' ? (
                            <>
                              <button 
                                className="user-edit-btn"
                                onClick={() => handleViewClick(property)}
                                title="View Property"
                              >
                                <FiEye />
                              </button>
                              <button 
                                className="user-edit-btn"
                                onClick={() => handleEditClick(property.id)}
                                title="Edit Property"
                              >
                                <FiEdit />
                              </button>
                              <button 
                                className="user-trash-btn"
                                onClick={() => handleMoveToTrash(property.id)}
                                title="Move to Trash"
                              >
                                <FiTrash2 />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="user-restore-btn"
                                onClick={() => handleRestoreProperty(property.id)}
                                title="Restore Property"
                              >
                                <FiRotateCcw />
                              </button>
                              <button 
                                className="user-delete-permanently-btn"
                                onClick={() => handleDeletePermanently(property.id)}
                                title="Delete Permanently"
                              >
                                <FiTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="user-mobile-list">
              {currentItems.map(property => (
                <div key={property.id} className="user-mobile-item">
                  <div className="user-mobile-header">
                    <h3 className="user-mobile-name">
                      {property.title || 'Beautiful Property'}
                    </h3>
                    <div className="property-mobile-price">
                      {formatPrice(property.price)}
                    </div>
                  </div>
                  
                  <div className="user-mobile-email">
                    <FiMapPin /> {property.city}, {property.canton}
                  </div>

                  <div className="user-mobile-stats">
                    <div className="user-mobile-stat">
                      <div className="user-mobile-stat-label">Owner</div>
                      <div className="user-mobile-stat-value">
                        <FiUser /> {getUserName(property.user_id)}
                      </div>
                    </div>
                    <div className="user-mobile-stat">
                      <div className="user-mobile-stat-label">Likes</div>
                      <div className="user-mobile-stat-value user-likes">
                        <FiHeart /> {property.likes_count || 0}
                      </div>
                    </div>
                    <div className="user-mobile-stat">
                      <div className="user-mobile-stat-label">Status</div>
                      <div className="user-mobile-stat-value">
                        {renderStatusBadge(property.status)}
                      </div>
                    </div>
                  </div>

                  <div className="user-mobile-actions">
                    {viewMode === 'active' ? (
                      <>
                        <button 
                          className="user-mobile-edit-btn"
                          onClick={() => handleViewClick(property)}
                        >
                          <FiEye />
                          View
                        </button>
                        <button 
                          className="user-mobile-edit-btn"
                          onClick={() => handleEditClick(property.id)}
                        >
                          <FiEdit />
                          Edit
                        </button>
                        <button 
                          className="user-mobile-trash-btn"
                          onClick={() => handleMoveToTrash(property.id)}
                        >
                          <FiTrash2 />
                          Move to Trash
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="user-mobile-restore-btn"
                          onClick={() => handleRestoreProperty(property.id)}
                        >
                          <FiRotateCcw />
                          Restore
                        </button>
                        <button 
                          className="user-mobile-delete-btn"
                          onClick={() => handleDeletePermanently(property.id)}
                        >
                          <FiTrash />
                          Delete Forever
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="user-pagination-container">
              <div className="user-pagination-info">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProperties.length)} of {filteredProperties.length} properties
              </div>
              
              <div className="user-pagination-controls">
                <button 
                  className="user-pagination-btn first-page" 
                  onClick={firstPage}
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  <FiChevronsLeft />
                </button>
                
                <button 
                  className="user-pagination-btn prev-page" 
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  <FiChevronLeft />
                </button>
                
                <div className="user-pagination-pages">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    let pageToShow;
                    
                    if (totalPages <= 5) {
                      pageToShow = index + 1;
                    } else {
                      const offset = Math.max(0, Math.min(totalPages - 5, currentPage - 3));
                      pageToShow = index + 1 + offset;
                    }
                    
                    return (
                      <button
                        key={pageToShow}
                        onClick={() => paginate(pageToShow)}
                        className={`user-pagination-btn page-number ${currentPage === pageToShow ? 'active' : ''}`}
                      >
                        {pageToShow}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="user-pagination-btn next-page" 
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  <FiChevronRight />
                </button>
                
                <button 
                  className="user-pagination-btn last-page" 
                  onClick={lastPage}
                  disabled={currentPage === totalPages}
                  title="Last Page"
                >
                  <FiChevronsRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Render PropertyModal only when it's loaded */}
      {isModalOpen && modalLoaded && PropertyModal && (
        <PropertyModal
          isOpen={isModalOpen}
          onClose={closeModal}
          property={currentProperty}
          onSave={handleSaveProperty}
        />
      )}
      
      {/* Show loading if modal is opening but not loaded yet */}
      {isModalOpen && !modalLoaded && (
        <div className="modal-overlay">
          <div className="user-loading-spinner">Loading modal...</div>
        </div>
      )}
    </section>
  );
}

export default PropertyManagement;