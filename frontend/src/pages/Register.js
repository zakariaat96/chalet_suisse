import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css'; 

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showContactLink, setShowContactLink] = useState(false); // NEW: Track if we should show contact link
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          
        //  console.log('Google Sign-In initialized successfully for registration');
        } catch (error) {
          console.error('Google Sign-In initialization error:', error);
          setMessage('Failed to initialize Google Sign-In');
          setMessageType('error');
        }
      }
    };

    // Load Google Sign-In script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
      //  console.log('Google Sign-In script loaded');
        initializeGoogleSignIn();
      };
      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
        setMessage('Failed to load Google Sign-In');
        setMessageType('error');
      };
      document.head.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }

    // Add window focus listener to detect popup close
    const handleWindowFocus = () => {
      if (loading && window.googleRegisterPopupOpen) {
        // Small delay to allow OAuth callback to fire first
        setTimeout(() => {
          if (loading) {
         //   console.log('Google register popup was closed, resetting loading state');
            setLoading(false);
            window.googleRegisterPopupOpen = false;
          }
        }, 1000);
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loading]);

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);
      setMessage('');
      setShowContactLink(false); // Reset contact link flag

    //  console.log('Google response received:', response);

      if (!response.credential) {
        setMessage('No credential received from Google');
        setMessageType('error');
        return;
      }

      // Use environment variable for API base URL
      const result = await fetch(`${process.env.REACT_APP_API_BASE_URL}/google-register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          token: response.credential
        })
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data = await result.json();
    //  console.log('Server response:', data);
      
      if (data.success) {
        if (data.new_user) {
          setMessage('Account created successfully with Google!');
          setMessageType('success');
          
          // Auto-login the user
          login({
            id: data.user_id, 
            email: data.email,
            is_admin: data.is_admin,
            name: data.name 
          });
        } else {
          setMessage('Account already exists. Logging you in...');
          setMessageType('success');
          
          // Auto-login existing user
          login({
            id: data.user_id, 
            email: data.email,
            is_admin: data.is_admin,
            name: data.name 
          });
        }
      } else {
        setMessage(data.message || 'Google registration failed');
        setMessageType('error');
        // NEW: Check if we should show contact link
        if (data.show_contact_link) {
          setShowContactLink(true);
        }
      }
    } catch (error) {
      console.error('Google registration error:', error);
      setMessage('Google registration failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Custom Google registration function that opens in popup
  const handleCustomGoogleRegister = () => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        setLoading(true);
        setMessage('');
        setShowContactLink(false); // Reset contact link flag
        window.googleRegisterPopupOpen = true; // Flag to track popup state
        
        // Use OAuth2 popup flow
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          scope: 'email profile',
          ux_mode: 'popup',
          callback: async (response) => {
            window.googleRegisterPopupOpen = false; // Reset flag
            if (response.access_token) {
              await handleGoogleTokenResponse(response.access_token);
            } else if (response.error) {
              console.error('Google OAuth error:', response.error);
              if (response.error === 'popup_closed_by_user' || response.error === 'access_denied') {
                setMessage(''); // Don't show error for user cancellation
                setMessageType('');
              } else {
                setMessage('Google sign-up failed');
                setMessageType('error');
              }
              setLoading(false);
            }
          },
          error_callback: (error) => {
            console.error('Google OAuth error callback:', error);
            window.googleRegisterPopupOpen = false; // Reset flag
            setLoading(false);
            setMessage(''); // Don't show error for user cancellation
            setMessageType('');
          }
        });
        
        // Add a timeout as backup
        const timeoutId = setTimeout(() => {
          if (window.googleRegisterPopupOpen) {
         //   console.log('Google register timeout - popup may have been closed');
            window.googleRegisterPopupOpen = false;
            setLoading(false);
          }
        }, 30000); // 30 second timeout
        
        client.requestAccessToken();
        
        // Clear timeout if component unmounts
        return () => clearTimeout(timeoutId);
        
      } catch (error) {
        console.error('Google OAuth error:', error);
        setMessage('Failed to initialize Google sign-up');
        setMessageType('error');
        setLoading(false);
        window.googleRegisterPopupOpen = false;
      }
    } else {
      setMessage('Google Sign-In not loaded');
      setMessageType('error');
    }
  };

  // Handle the access token from Google OAuth popup
  const handleGoogleTokenResponse = async (accessToken) => {
    try {
      // Clear any existing timeout
      if (window.googleRegisterTimeout) {
        clearTimeout(window.googleRegisterTimeout);
      }
      
      // Get user info from Google using the access token
      const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      const userInfo = await userInfoResponse.json();
      
      if (!userInfo.email) {
        setMessage('Failed to get user information from Google');
        setMessageType('error');
        return;
      }

      // Send user info to your backend
      const result = await fetch(`${process.env.REACT_APP_API_BASE_URL}/google-oauth-register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: userInfo.email,
          name: userInfo.name,
          google_id: userInfo.id,
          picture: userInfo.picture
        })
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data = await result.json();
    //  console.log('Server response:', data);
      
      if (data.success) {
        if (data.new_user) {
          setMessage('Account created successfully with Google!');
          setMessageType('success');
          
          // Auto-login the user
          login({
            id: data.user_id, 
            email: data.email,
            is_admin: data.is_admin,
            name: data.name 
          });
        } else {
          setMessage('Account already exists. Logging you in...');
          setMessageType('success');
          
          // Auto-login existing user
          login({
            id: data.user_id, 
            email: data.email,
            is_admin: data.is_admin,
            name: data.name 
          });
        }
      } else {
        setMessage(data.message || 'Google registration failed');
        setMessageType('error');
        // NEW: Check if we should show contact link
        if (data.show_contact_link) {
          setShowContactLink(true);
        }
      }
    } catch (error) {
      console.error('Google token processing error:', error);
      setMessage('Google registration failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords don't match!");
      setMessageType('error');
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters long!");
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setShowContactLink(false); // Reset contact link flag

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/register.php`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password 
        }),
      });

      const data = await response.json();
      
      if (data.success || data.message.includes("success")) {
        setMessage(data.message || "Registration successful!");
        setMessageType('success');
        
        // Redirect to login after successful registration
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(data.message || "Registration failed.");
        setMessageType('error');
        // NEW: Check if we should show contact link
        if (data.show_contact_link) {
          setShowContactLink(true);
        }
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setMessageType('error');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Shapes */}
      <div className="shape1"></div>
      <div className="shape2"></div>
      
      <div className="login-form-container">
        <div className="login-header">
          <h1>
            <span className="gradient-text">Create Account</span>
          </h1>
          <p>Sign up to get started</p>
        </div>
        
        {message && (
          <div className={`${messageType === 'success' ? 'success-message' : 'error-message'}`}>
            {message}
            {/* NEW: Show contact link if user is banned */}
            {showContactLink && messageType === 'error' && (
              <p>
                <Link to="/contact">Contact Support</Link>
              </p>
            )}
          </div>
        )}
        
        {/* Custom Google Sign-Up Button */}
        <div className="google-signin-container">
          <button 
            type="button" 
            onClick={handleCustomGoogleRegister}
            className={`google-signin-button ${loading ? 'loading' : ''}`}
            disabled={loading}
            style={{ 
              height: loading ? '41px' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px', opacity: loading ? 0 : 1 }}>
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28l2.67-2.14z"/>
              <path fill="#EA4335" d="M8.98 3.54c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-3.88z"/>
            </svg>
            {loading ? '' : 'Sign up with Google'}
          </button>
        </div>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <form onSubmit={handleRegister} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`login-button ${loading ? 'loading' : ''}`} 
            disabled={loading}
            style={{ 
              height: loading ? '45px' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {loading ? '' : 'Create Account'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
          <p>
            <Link to="/">Return to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;