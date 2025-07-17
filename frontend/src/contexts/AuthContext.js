// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Session sync function - NEW
  const syncSession = async () => {
    if (!user) return; // Only sync if user thinks they're logged in
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/check_session_status.php`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      // If frontend thinks user is logged in but backend session expired
      if (user && !data.logged_in) {
       // console.log('Backend session expired, logging out...');
        localStorage.removeItem('user');
        localStorage.removeItem('favorites');
        setUser(null);
        // Don't navigate to login, just clear the session
      }
      
      // If backend has session but frontend doesn't have complete user data
      if (data.logged_in && (!user || !user.id)) {
    //    console.log('Syncing user data from backend session...');
        const syncedUser = {
          id: data.user_id,
          email: data.email,
          is_admin: data.is_admin,
          name: data.name
        };
        localStorage.setItem('user', JSON.stringify(syncedUser));
        setUser(syncedUser);
      }
      
    } catch (error) {
   //   console.log('Session sync failed (this is normal if not logged in):', error);
    }
  };

  useEffect(() => {
    // Check for user in localStorage - UNCHANGED
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);
    setLoading(false);
    
    // NEW: Sync with backend session after loading from localStorage
    if (storedUser) {
      setTimeout(syncSession, 100); // Small delay to ensure everything is loaded
    }
  }, []);

  // NEW: Periodic session check every 5 minutes (only if user is logged in)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(syncSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // NEW: Check session when user comes back to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        syncSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Login function - UNCHANGED
  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    // Redirect based on user type
    if (userData.is_admin) {
      navigate('/admin-dashboard');
    } else {
      navigate('/user-dashboard');
    }
  };

  // Logout function - ENHANCED
  const logout = async () => {
    // NEW: Call backend logout to destroy server session
    try {
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/logout.php`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
    //  console.log('Backend logout failed (this is usually fine):', error);
    }
    
    // Original logout logic - UNCHANGED
    localStorage.removeItem('user');
    localStorage.removeItem('favorites'); // NEW: Also clear favorites
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    syncSession, // NEW: Expose sync function
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
    isUser: !!user && !user.is_admin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};