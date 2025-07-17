import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiX, FiSave, FiSearch, FiRefreshCw, FiChevronDown, FiHeart, FiHome,
  FiFilter, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiArchive, FiRotateCcw, FiTrash, FiClock } from 'react-icons/fi';
import '../styles/UserManagement.css';

function UserModal({ isOpen, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    is_admin: 0
  });
  const [formErrors, setFormErrors] = useState({});

  // When the modal opens, set form data to user data if editing
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't display the password
        is_admin: user.is_admin || 0
      });
    } else {
      // Reset form for new user
      setFormData({
        name: '',
        email: '',
        password: '',
        is_admin: 0
      });
    }
    // Clear errors when modal opens
    setFormErrors({});
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Only validate password for new users
    if (!user && !formData.password) {
      errors.password = 'Password is required for new users';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...formData,
        id: user ? user.id : null
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="user-modal-overlay">
      <div className="user-modal-content">
        <div className="user-modal-header">
          <h3>{user ? `Edit User: ${user.name}` : 'Add New User'}</h3>
          <button className="user-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="user-form">
          <div className="user-form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && <div className="user-error-text">{formErrors.name}</div>}
          </div>
          
          <div className="user-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={formErrors.email ? 'error' : ''}
            />
            {formErrors.email && <div className="user-error-text">{formErrors.email}</div>}
          </div>
          
          <div className="user-form-group">
            <label htmlFor="password">
              {user ? 'Password (leave empty to keep current)' : 'Password'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={formErrors.password ? 'error' : ''}
            />
            {formErrors.password && <div className="user-error-text">{formErrors.password}</div>}
          </div>
          
          <div className="user-form-group user-checkbox-group">
            <input
              type="checkbox"
              id="is_admin"
              name="is_admin"
              checked={formData.is_admin == 1}
              onChange={handleChange}
            />
            <label htmlFor="is_admin">Admin User</label>
          </div>
          
          <div className="user-form-actions">
            <button type="submit" className="user-save-btn">
              <FiSave /> Save User
            </button>
            <button type="button" className="user-cancel-btn" onClick={onClose}>
              <FiX /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'trash'
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);

  // Function to format last login date
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) {
      return 'Never';
    }
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Format time as HH:MM AM/PM
    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    const timeString = date.toLocaleTimeString('en-US', timeOptions);
    
    if (diffDays === 0) {
      // Today - show "Today at 2:30 PM"
      return `Today at ${timeString}`;
    } else if (diffDays === 1) {
      // Yesterday - show "Yesterday at 2:30 PM"
      return `Yesterday at ${timeString}`;
    } else {
      // Older than yesterday - show "3 days ago on Dec 15, 2024 at 2:30 PM"
      const dateString = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      return `${diffDays} days ago on ${dateString} at ${timeString}`;
    }
  };

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

  // Fetch users from the API
  useEffect(() => {
    fetchUsers();
  }, [viewMode]); // Refetch when we toggle between active and trash

  // Filter and sort users when search term or sort order changes
  useEffect(() => {
    if (!users.length) return;
    
    let result = [...users];
    
    // Filter based on search term
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(lowercasedSearch) || 
        user.email.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Sort or filter based on sort order
    switch(sortOrder) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'likes-desc':
        result.sort((a, b) => parseInt(b.liked_chalets_count) - parseInt(a.liked_chalets_count));
        break;
      case 'likes-asc':
        result.sort((a, b) => parseInt(a.liked_chalets_count) - parseInt(b.liked_chalets_count));
        break;
      case 'chalets-desc':
        result.sort((a, b) => parseInt(b.owned_chalets_count || 0) - parseInt(a.owned_chalets_count || 0));
        break;
      case 'chalets-asc':
        result.sort((a, b) => parseInt(a.owned_chalets_count || 0) - parseInt(b.owned_chalets_count || 0));
        break;
      case 'last-login-desc':
        result.sort((a, b) => {
          const dateA = a.last_login ? new Date(a.last_login) : new Date(0);
          const dateB = b.last_login ? new Date(b.last_login) : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'last-login-asc':
        result.sort((a, b) => {
          const dateA = a.last_login ? new Date(a.last_login) : new Date(0);
          const dateB = b.last_login ? new Date(b.last_login) : new Date(0);
          return dateA - dateB;
        });
        break;
      case 'admins-only':
        result = result.filter(user => user.is_admin == 1);
        break;
      case 'regular-only':
        result = result.filter(user => user.is_admin == 0);
        break;
      case 'owners-only':
        result = result.filter(user => parseInt(user.owned_chalets_count || 0) > 0);
        break;
      default:
        break;
    }
    
    setFilteredUsers(result);
    // Reset to first page when filtering/sorting changes
    setCurrentPage(1);
  }, [users, searchTerm, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = viewMode === 'active' 
        ? `${process.env.REACT_APP_API_BASE_URL}/get_users.php`	 
        : `${process.env.REACT_APP_API_BASE_URL}/get_trash_users.php`;
      
      const response = await fetch(endpoint, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${viewMode} users`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } else {
        setError(data.message || `Failed to fetch ${viewMode} users`);
      }
    } catch (error) {
      console.error(`Error fetching ${viewMode} users:`, error);
      setError(`Error fetching ${viewMode} users. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (userId) => {
    const user = users.find(user => user.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsModalOpen(true);
    }
  };

  const handleAddClick = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleMoveToTrash = async (userId) => {
    if (window.confirm('Are you sure you want to move this user to trash?')) {
      try {
     //   console.log('Moving user to trash with ID:', userId);
        
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/trash_user.php`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId }),
        });
        
        // Log the raw response for debugging
        const responseText = await response.text();
     //   console.log('Raw response:', responseText);
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          alert('Error: Server returned invalid response');
          return;
        }
        
      //  console.log('Parsed response:', data);
        
        if (data.success) {
          // Remove user from state
          setUsers(users.filter(user => user.id !== userId));
          alert('User moved to trash successfully');
        } else {
          alert(data.message || 'Failed to move user to trash');
        }
      } catch (error) {
        console.error('Error moving user to trash:', error);
        alert('Error moving user to trash: ' + error.message);
      }
    }
  };
  
  const handleRestoreUser = async (userId) => {
    if (window.confirm('Are you sure you want to restore this user?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/restore_user.php`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId }),
        });
        
        const responseText = await response.text();
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          alert('Error: Server returned invalid response');
          return;
        }
        
        if (data.success) {
          // Remove user from trash list
          setUsers(users.filter(user => user.id !== userId));
          alert('User restored successfully');
        } else {
          alert(data.message || 'Failed to restore user');
        }
      } catch (error) {
        console.error('Error restoring user:', error);
        alert('Error restoring user: ' + error.message);
      }
    }
  };
  
  const handleDeletePermanently = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/delete_user_permanently.php`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId }),
        });
        
        const responseText = await response.text();
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          alert('Error: Server returned invalid response');
          return;
        }
        
        if (data.success) {
          // Remove user from trash list
          setUsers(users.filter(user => user.id !== userId));
          alert('User permanently deleted');
        } else {
          alert(data.message || 'Failed to permanently delete user');
        }
      } catch (error) {
        console.error('Error deleting user permanently:', error);
        alert('Error deleting user permanently: ' + error.message);
      }
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/save_user.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (userData.id) {
          // Update existing user in state
          setUsers(users.map(user => 
            user.id === userData.id ? data.user : user
          ));
        } else {
          // Add new user to state
          setUsers([data.user, ...users]);
        }
        
        setIsModalOpen(false);
        alert(data.message);
      } else {
        alert(data.message || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please try again later.');
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
    // Reset filters when switching views
    setSearchTerm('');
    setSortOrder('newest');
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const firstPage = () => setCurrentPage(1);
  const lastPage = () => setCurrentPage(totalPages);

  return (
    <section id="users" className="dashboard-section">
      <div className="user-section-header">
        <div className="user-section-title-row">
          <h2 className="user-section-title">
            {viewMode === 'active' ? 'User Management' : 'Trash'}
          </h2>
          <div className="user-header-actions">
            <button 
              className={`user-toggle-view-btn ${viewMode === 'trash' ? 'active' : ''}`} 
              onClick={toggleViewMode}
              title={viewMode === 'active' ? 'View Trash' : 'View Active Users'}
            >
              {viewMode === 'active' ? (
                <><FiTrash2 /> View Trash</>
              ) : (
                <><FiArchive /> View Active Users</>
              )}
            </button>
            
            {viewMode === 'active' && (
              <button className="user-add-btn" onClick={handleAddClick}>
                <FiPlus /> Add New User
              </button>
            )}
          </div>
        </div>
        <p className="user-section-subtitle">
          {viewMode === 'active' 
            ? 'Manage all registered users' 
            : 'View and manage deleted users'}
        </p>
        
        <div className="user-search-card">
          <div className="user-search-input-wrapper">
            <FiSearch className="user-search-icon" />
            <input
              type="text"
              className="user-search-input"
              placeholder="Search by name or email..."
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
                {sortOrder === 'oldest' && 'Oldest First'}
                {sortOrder === 'name-asc' && 'Name (A-Z)'}
                {sortOrder === 'name-desc' && 'Name (Z-A)'}
                {sortOrder === 'likes-desc' && 'Most Liked Chalets'}
                {sortOrder === 'likes-asc' && 'Fewest Liked Chalets'}
                {sortOrder === 'chalets-desc' && 'Most Owned Chalets'}
                {sortOrder === 'chalets-asc' && 'Fewest Owned Chalets'}
                {sortOrder === 'last-login-desc' && 'Recent Login'}
                {sortOrder === 'last-login-asc' && 'Oldest Login'}
                {sortOrder === 'admins-only' && 'Admins Only'}
                {sortOrder === 'regular-only' && 'Regular Users Only'}
                {sortOrder === 'owners-only' && 'Chalet Owners Only'}
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
                      className={`user-sort-option ${sortOrder === 'oldest' ? 'active' : ''}`}
                      onClick={() => handleSortChange('oldest')}
                    >
                      Oldest First
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
                      Most Liked Chalets
                    </button>
                    <button 
                      className={`user-sort-option ${sortOrder === 'likes-asc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('likes-asc')}
                    >
                      Fewest Liked Chalets
                    </button>
                    <button 
                      className={`user-sort-option ${sortOrder === 'chalets-desc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('chalets-desc')}
                    >
                      Most Owned Chalets
                    </button>
                    <button 
                      className={`user-sort-option ${sortOrder === 'chalets-asc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('chalets-asc')}
                    >
                      Fewest Owned Chalets
                    </button>
                    <button 
                      className={`user-sort-option ${sortOrder === 'last-login-desc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('last-login-desc')}
                    >
                      Recent Login
                    </button>
                    <button 
                      className={`user-sort-option ${sortOrder === 'last-login-asc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('last-login-asc')}
                    >
                      Oldest Login
                    </button>
                  </div>
                  
                  <div className="user-dropdown-divider"></div>
                  
                  <div className="user-dropdown-section">
                    <div className="user-dropdown-section-title">Filter by Role</div>
                    <button 
                      className={`user-sort-option ${sortOrder === 'newest' || sortOrder === 'oldest' || sortOrder === 'name-asc' || sortOrder === 'name-desc' || sortOrder === 'likes-desc' || sortOrder === 'likes-asc' || sortOrder === 'chalets-desc' || sortOrder === 'chalets-asc' || sortOrder === 'last-login-desc' || sortOrder === 'last-login-asc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('newest')}
                    >
                      All Users
                    </button>
                    <button 
                      className={`user-sort-option ${sortOrder === 'admins-only' ? 'active' : ''}`}
                      onClick={() => handleSortChange('admins-only')}
                    >
                      Admins Only
                    </button>
                    <button 
                      className={`user-sort-option ${sortOrder === 'regular-only' ? 'active' : ''}`}
                      onClick={() => handleSortChange('regular-only')}
                    >
                      Regular Users Only
                    </button>
                    <button 
                      className={`user-sort-option ${sortOrder === 'owners-only' ? 'active' : ''}`}
                      onClick={() => handleSortChange('owners-only')}
                    >
                      Chalet Owners Only
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button className="user-refresh-btn" onClick={fetchUsers} title="Refresh Users">
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </div>
      
      <div className="section-content">
        {loading ? (
          <div className="user-loading-spinner">Loading users...</div>
        ) : error ? (
          <div className="user-error-message">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="user-no-results">
            {viewMode === 'active' ? (
              searchTerm || sortOrder === 'admins-only' || sortOrder === 'regular-only' || sortOrder === 'owners-only' ? 
                'No users match your search criteria.' : 
                'No users found.'
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Liked Chalets</th>
                    <th>Owned Chalets</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.is_admin == 1 ? 'Admin' : 'User'}</td>
                      <td>
                        <span className="user-likes-badge">
                          <FiHeart className="user-heart-icon" /> {user.liked_chalets_count || 0}
                        </span>
                      </td>
                      <td>
                        <span className="user-chalets-badge">
                          <FiHome className="user-home-icon" /> {user.owned_chalets_count || 0}
                        </span>
                      </td>
                      <td>
                        <span className="user-last-login-badge">
                          <FiClock className="user-clock-icon" /> {formatLastLogin(user.last_login)}
                        </span>
                      </td>
                      <td>
                        <div className="user-action-buttons">
                          {viewMode === 'active' ? (
                            <>
                              <button 
                                className="user-edit-btn"
                                onClick={() => handleEditClick(user.id)}
                                title="Edit User"
                              >
                                <FiEdit />
                              </button>
                              <button 
                                className="user-trash-btn"
                                onClick={() => handleMoveToTrash(user.id)}
                                title="Move to Trash"
                              >
                                <FiTrash2 />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="user-restore-btn"
                                onClick={() => handleRestoreUser(user.id)}
                                title="Restore User"
                              >
                                <FiRotateCcw />
                              </button>
                              <button 
                                className="user-delete-permanently-btn"
                                onClick={() => handleDeletePermanently(user.id)}
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
              {currentUsers.map(user => (
                <div key={user.id} className="user-mobile-item">
                  <div className="user-mobile-header">
                    <h3 className="user-mobile-name">{user.name}</h3>
                    <span className={`user-mobile-role ${user.is_admin == 1 ? 'admin' : 'user'}`}>
                      {user.is_admin == 1 ? 'Admin' : 'User'}
                    </span>
                  </div>
                  
                  <div className="user-mobile-email">
                    {user.email}
                  </div>

                  <div className="user-mobile-stats">
                    <div className="user-mobile-stat">
                      <div className="user-mobile-stat-label">Liked Chalets</div>
                      <div className="user-mobile-stat-value likes">
                        <FiHeart /> {user.liked_chalets_count || 0}
                      </div>
                    </div>
                    <div className="user-mobile-stat">
                      <div className="user-mobile-stat-label">Owned Chalets</div>
                      <div className="user-mobile-stat-value chalets">
                        <FiHome /> {user.owned_chalets_count || 0}
                      </div>
                    </div>
                    <div className="user-mobile-stat">
                      <div className="user-mobile-stat-label">Last Login</div>
                      <div className="user-mobile-stat-value last-login">
                        <FiClock /> {formatLastLogin(user.last_login)}
                      </div>
                    </div>
                  </div>

                  <div className="user-mobile-actions">
                    {viewMode === 'active' ? (
                      <>
                        <button 
                          className="user-mobile-edit-btn"
                          onClick={() => handleEditClick(user.id)}
                        >
                          <FiEdit />
                          Edit
                        </button>
                        <button 
                          className="user-mobile-trash-btn"
                          onClick={() => handleMoveToTrash(user.id)}
                        >
                          <FiTrash2 />
                          Move to Trash
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="user-mobile-restore-btn"
                          onClick={() => handleRestoreUser(user.id)}
                        >
                          <FiRotateCcw />
                          Restore
                        </button>
                        <button 
                          className="user-mobile-delete-btn"
                          onClick={() => handleDeletePermanently(user.id)}
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
            
            {/* Pagination Controls */}
            <div className="user-pagination-container">
              <div className="user-pagination-info">
                Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
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
                    // Show pages around current page
                    let pageToShow;
                    
                    if (totalPages <= 5) {
                      // If we have 5 or fewer pages, show all pages
                      pageToShow = index + 1;
                    } else {
                      // For more than 5 pages, show a window of pages around current page
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

      {/* User Modal for Adding/Editing */}
      <UserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        user={currentUser}
        onSave={handleSaveUser}
      />
    </section>
  );
}

export default UserManagement;