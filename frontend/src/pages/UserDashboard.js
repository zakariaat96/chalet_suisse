// UserDashboard.jsx - Updated with OAuth detection for profile editing
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Property from '../components/Property';
import { 
  FiHome, 
  FiTrash2, 
  FiEye, 
  FiHeart, 
  FiPieChart, 
  FiCalendar, 
  FiUsers,
  FiBarChart2,
  FiEdit,
  FiPlus,
  FiMapPin,
  FiUser,
  FiDroplet,
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronsLeft, 
  FiChevronsRight
} from 'react-icons/fi';
import '../styles/UserDashboard.css';

function UserDashboard() {
  const [chalets, setChalets] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showChaletModal, setShowChaletModal] = useState(false);
  
  // User info state
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    isGoogleUser: false
  });

  // Profile edit form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  // Form state for chalet request
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  // Submission state for chalet request
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  // Pagination state for favorites
  const [currentPage, setCurrentPage] = useState(1);
  const [favoritesPerPage] = useState(5);

  // Function to prevent body scroll
  const disableBodyScroll = () => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-scroll-y', scrollY.toString());
  };

  // Function to restore body scroll
  const enableBodyScroll = () => {
    const scrollY = document.body.getAttribute('data-scroll-y');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY, 10));
      document.body.removeAttribute('data-scroll-y');
    }
  };

  // Effect to handle body scroll when modals open/close
  useEffect(() => {
    if (showModal || showChaletModal) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }

    return () => {
      if (showModal || showChaletModal) {
        enableBodyScroll();
      }
    };
  }, [showModal, showChaletModal]);

  // Fetch user info to determine if they're a Google user
  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/get_user_info.php`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const isGoogleUser = !data.has_password; // If no password, they're a Google user
          setUserInfo({
            name: data.name || '',
            email: data.email || '',
            isGoogleUser: isGoogleUser
          });
          
          // Set initial form values
          setProfileForm(prev => ({
            ...prev,
            name: data.name || '',
            email: data.email || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Function to fetch user chalets
  const fetchChalets = () => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/get_user_chalets.php`, {
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setChalets(data.chalets || data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching chalets:', error);
        setChalets([]);
        setLoading(false);
      });
  };

  // Function to fetch favorite chalets
  const fetchFavorites = () => {
    setFavoritesLoading(true);
    
    fetch(`${process.env.REACT_APP_API_BASE_URL}/get_user_favorites.php`, {
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch favorites');
        return res.json();
      })
      .then(data => {
     //   console.log('Favorites data:', data);
        if (data.success && Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        } else {
          setFavorites([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching favorites:', error);
        setFavorites([]);
      })
      .finally(() => {
        setFavoritesLoading(false);
      });
  };

  // Initial data loading
  useEffect(() => {
    fetchUserInfo();
    fetchChalets();
    fetchFavorites();
    
    const handleStorageChange = () => {
      fetchFavorites();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleStorageChange);
    };
  }, []);

  // Reset to first page when favorites change
  useEffect(() => {
    setCurrentPage(1);
  }, [favorites.length]);

  // Validate profile form
  const validateProfileForm = () => {
    const errors = {};
    
    // Name validation
    if (!profileForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    // Email validation (only for non-Google users)
    if (!userInfo.isGoogleUser) {
      if (!profileForm.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
        errors.email = 'Invalid email format';
      }
    }
    
    // Password validation (only if changing password and for non-Google users)
    if (!userInfo.isGoogleUser && (profileForm.oldPassword || profileForm.newPassword || profileForm.confirmNewPassword)) {
      if (!profileForm.oldPassword) {
        errors.oldPassword = 'Current password is required';
      }
      if (!profileForm.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (profileForm.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      }
      if (!profileForm.confirmNewPassword) {
        errors.confirmNewPassword = 'Please confirm new password';
      } else if (profileForm.newPassword !== profileForm.confirmNewPassword) {
        errors.confirmNewPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsUpdating(true);
    setUpdateMessage('');
    setUpdateStatus('');
    
    try {
      const updateData = {
        name: profileForm.name
      };
      
      // Only include email and password for non-Google users
      if (!userInfo.isGoogleUser) {
        updateData.email = profileForm.email;
        
        if (profileForm.oldPassword && profileForm.newPassword) {
          updateData.oldPassword = profileForm.oldPassword;
          updateData.newPassword = profileForm.newPassword;
        }
      }
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/update_profile.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUpdateMessage('Profile updated successfully!');
        setUpdateStatus('success');
        
        // Update local state
        setUserInfo(prev => ({
          ...prev,
          name: profileForm.name,
          email: userInfo.isGoogleUser ? prev.email : profileForm.email
        }));
        
        // Update localStorage if user data is stored there
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            user.name = profileForm.name;
            if (!userInfo.isGoogleUser) {
              user.email = profileForm.email;
            }
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            console.error('Error updating stored user data:', e);
          }
        }
        
        // Clear password fields
        setProfileForm(prev => ({
          ...prev,
          oldPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }));
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowModal(false);
          setUpdateMessage('');
          setUpdateStatus('');
        }, 2000);
      } else {
        setUpdateMessage(data.message || 'Failed to update profile');
        setUpdateStatus('error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setUpdateMessage('Network error. Please try again.');
      setUpdateStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle remove favorite
  const handleRemoveFavorite = (chaletId) => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/remove_from_favorites.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chaletId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFavorites(favorites.filter(chalet => chalet.id.toString() !== chaletId.toString()));
          
          try {
            const favoritesString = localStorage.getItem('favorites');
            if (favoritesString) {
              const storedFavorites = JSON.parse(favoritesString);
              const updatedFavorites = storedFavorites.filter(id => id.toString() !== chaletId.toString());
              localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
              
              window.dispatchEvent(new Event('storage'));
              window.dispatchEvent(new CustomEvent('favoritesChanged', {
                detail: { chaletId: chaletId.toString(), isLiked: false }
              }));
            }
          } catch (e) {
            console.error('Error updating localStorage favorites:', e);
          }
          
          fetchFavorites();
        }
      })
      .catch(error => {
        console.error('Error removing favorite:', error);
      });
  };

  const handleChaletFormSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setSubmitMessage('Please fill in all required fields.');
      setSubmitStatus('error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
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
          ...form,
          formType: 'chalet_request'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage(data.message);
        setSubmitStatus('success');
        setForm({ name: '', email: '', phone: '', message: '' });
        
        setTimeout(() => {
          setShowChaletModal(false);
          setSubmitMessage('');
          setSubmitStatus('');
        }, 2000);
      } else {
        setSubmitMessage(data.message || 'Failed to submit request. Please try again.');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Chalet request error:', error);
      setSubmitMessage('Network error. Please check your connection and try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format price with commas
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return typeof price === 'number' 
      ? price.toLocaleString() 
      : Number(price) ? Number(price).toLocaleString() : price;
  };

  // Get username for display
  const getUserName = () => {
    if (userInfo.name) {
      return userInfo.name;
    }
    
    const userData = localStorage.getItem('user');
    if (!userData) return 'User';
    
    try {
      const user = JSON.parse(userData);
      if (user.name) return user.name;
      
      if (!user.email) return 'User';
      
      const emailParts = user.email.split('@');
      if (emailParts.length > 1) {
        return emailParts[0];
      }
      
      return 'User';
    } catch (error) {
      return 'User';
    }
  };

  // Helper function to get the first available bedroom value
  const getBedroomValue = (chalet) => {
    return chalet.bedrooms || chalet.bedroom_count || chalet.bed_count || chalet.beds || 'N/A';
  };

  // Helper function to get the first available bathroom value
  const getBathroomValue = (chalet) => {
    return chalet.bathrooms || chalet.bathroom_count || chalet.bath_count || chalet.baths || 'N/A';
  };

  // Create a slug from the title for the URL
  const createSlug = (title) => {
    if (!title) return '';
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  // Pagination logic for favorites
  const indexOfLastFavorite = currentPage * favoritesPerPage;
  const indexOfFirstFavorite = indexOfLastFavorite - favoritesPerPage;
  const currentFavorites = favorites.slice(indexOfFirstFavorite, indexOfLastFavorite);
  const totalPages = Math.ceil(favorites.length / favoritesPerPage);

  // Pagination functions
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const firstPage = () => setCurrentPage(1);
  const lastPage = () => setCurrentPage(totalPages);

  return (
    <div className="user-dashboard-container">
      <Navbar />
      <div className="user-dashboard-scroll">
        <aside className="user-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title"><span className="gradient-text">User</span> Dashboard</h2>
          </div>
          <nav className="sidebar-nav">
            <ul>
              <li><a href="#home" className="nav-link"><FiBarChart2 className="nav-icon" /> Dashboard</a></li>
              <li><a href="#my-chalets" className="nav-link"><FiHome className="nav-icon" /> My Chalets</a></li>
              <li><a href="#liked-chalets" className="nav-link"><FiHeart className="nav-icon" /> Liked Chalets</a></li>
            </ul>
          </nav>
        </aside>

        <main className="user-main">
          <header className="user-header">
            <div className="header-content">
              <div>
                <h1>Welcome, <span className="gradient-text">{getUserName()}</span></h1>
              </div>
              <button className="profile-edit-btn" onClick={() => setShowModal(true)}>
                <FiEdit className="btn-icon" /> Edit Profile
              </button>
            </div>
          </header>

          <div className="user-content">
            <section id="home" className="dashboard-section">
              <h2><FiPieChart className="section-icon" /> Dashboard Overview</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <h3><FiHome className="stat-icon" /> Total Chalets</h3>
                  <p>{chalets.length}</p>
                </div>
                
                <div className="stat-card">
                  <h3><FiHeart className="stat-icon" /> Liked Chalets</h3>
                  <p>{favorites.length}</p>
                </div>
                
                <div className="stat-card">
                  <h3><FiCalendar className="stat-icon" /> Last Login</h3>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </section>

            <section id="my-chalets" className="dashboard-section">
              <h2><FiHome className="section-icon" /> My Chalets</h2>
              <button className="add-chalet-btn" onClick={() => setShowChaletModal(true)}>
                <FiPlus className="btn-icon" /> Add New Chalet
              </button>

              {loading ? (
                <div className="loading-spinner">Loading your chalets...</div>
              ) : chalets.length === 0 ? (
                <div className="no-results">No chalets found.</div>
              ) : (
                <div className="chalet-list">
                  {chalets.map((chalet) => (
                    <Property 
                      key={chalet.id} 
                      property={chalet}
                      variant="dashboard"
                    />
                  ))}
                </div>
              )}
            </section>

            <section id="liked-chalets" className="dashboard-section">
              <h2><FiHeart className="section-icon" /> Liked Chalets</h2>
              <p>Chalets you've liked.</p>
              
              {favoritesLoading ? (
                <div className="loading-spinner">Loading your favorites...</div>
              ) : favorites.length === 0 ? (
                <div className="no-results">No liked chalets found. Like some chalets to see them here!</div>
              ) : (
                <>
                  {/* Desktop/Tablet Table View */}
                  <div className="favorites-table-container">
                    <table className="favorites-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Location</th>
                          <th>Price (₣)</th>
                          <th>Beds</th>
                          <th>Baths</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentFavorites.map((chalet) => (
                          <tr key={chalet.id}>
                            <td>{chalet.title || 'Beautiful Chalet'}</td>
                            <td>{chalet.city || 'Unknown Location'}</td>
                            <td>{formatPrice(chalet.price)}</td>
                            <td>{getBedroomValue(chalet)}</td>
                            <td>{getBathroomValue(chalet)}</td>
                            <td className="action-buttons">
                              <Link 
                                to={`/chalet/${createSlug(chalet.title)}`}
                                state={{ propertyId: chalet.id }}
                                className="view-btn" 
                                title="View Details"
                              >
                                <FiEye />
                              </Link>
                              <button 
                                className="remove-btn" 
                                onClick={() => handleRemoveFavorite(chalet.id)}
                                title="Remove from Favorites"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile List View */}
                  <div className="mobile-favorites-list">
                    {currentFavorites.map((chalet) => (
                      <div key={chalet.id} className="mobile-favorite-item">
                        <div className="mobile-favorite-header">
                          <h3 className="mobile-favorite-title">
                            {chalet.title || 'Beautiful Chalet'}
                          </h3>
                          <div className="mobile-favorite-price">
                            ₣ {formatPrice(chalet.price)}
                          </div>
                        </div>
                        
                        <div className="mobile-favorite-details">
                          <div className="mobile-favorite-detail">
                            <FiMapPin /> {chalet.city || 'Unknown Location'}
                          </div>
                          <div className="mobile-favorite-detail">
                            <FiUser /> {getBedroomValue(chalet)} beds
                          </div>
                          <div className="mobile-favorite-detail">
                            <FiDroplet /> {getBathroomValue(chalet)} baths
                          </div>
                        </div>

                        <div className="mobile-favorite-actions">
                          <Link 
                            to={`/chalet/${createSlug(chalet.title)}`}
                            state={{ propertyId: chalet.id }}
                            className="mobile-view-btn"
                          >
                            <FiEye />
                            View
                          </Link>
                          <button 
                            className="mobile-remove-btn" 
                            onClick={() => handleRemoveFavorite(chalet.id)}
                          >
                            <FiTrash2 />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="user-pagination-container">
                    <div className="user-pagination-info">
                      Showing {indexOfFirstFavorite + 1}-{Math.min(indexOfLastFavorite, favorites.length)} of {favorites.length} chalets
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
            </section>
          </div>
        </main>
      </div>
      <Footer />

      {/* Edit Profile Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Profile</h3>
            
            {updateMessage && (
              <div className={`submit-message ${updateStatus}`}>
                {updateMessage}
              </div>
            )}
            
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  disabled={isUpdating}
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={userInfo.isGoogleUser ? userInfo.email : profileForm.email}
                  onChange={(e) => !userInfo.isGoogleUser && setProfileForm({ ...profileForm, email: e.target.value })}
                  disabled={isUpdating || userInfo.isGoogleUser}
                  className={userInfo.isGoogleUser ? "disabled-input" : ""}
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>
              
              {!userInfo.isGoogleUser && (
                <div className="password-section">
                  <h4>Change Password</h4>
                  <small>Leave blank to keep current password</small>
                  
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={profileForm.oldPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, oldPassword: e.target.value })}
                      disabled={isUpdating}
                    />
                    {formErrors.oldPassword && <span className="error-text">{formErrors.oldPassword}</span>}
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="New Password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      disabled={isUpdating}
                    />
                    {formErrors.newPassword && <span className="error-text">{formErrors.newPassword}</span>}
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={profileForm.confirmNewPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmNewPassword: e.target.value })}
                      disabled={isUpdating}
                    />
                    {formErrors.confirmNewPassword && <span className="error-text">{formErrors.confirmNewPassword}</span>}
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="spinner"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => {
                    setShowModal(false);
                    setFormErrors({});
                    setUpdateMessage('');
                    setUpdateStatus('');
                    // Reset form to original values
                    setProfileForm({
                      name: userInfo.name,
                      email: userInfo.email,
                      oldPassword: '',
                      newPassword: '',
                      confirmNewPassword: ''
                    });
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Chalet Request Modal */}
      {showChaletModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Request to Add New Chalet</h3>
            
            {submitMessage && (
              <div className={`submit-message ${submitStatus}`}>
                {submitMessage}
              </div>
            )}
            
            <form onSubmit={handleChaletFormSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Your Email *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Message (Details about the chalet you want to add) *"
                  rows="5"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Sending...
                    </>
                  ) : (
                    'Send Request'
                  )}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => {
                    setShowChaletModal(false);
                    setSubmitMessage('');
                    setSubmitStatus('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;