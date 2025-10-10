import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../lib/auth.js';
import { sessionManager } from '../lib/sessionManager.js';

/**
 * Authentication context interface
 */
const AuthContextType = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  sessionWarning: null,
  login: async () => ({}),
  logout: async () => {},
  refreshProfile: async () => {},
  extendSession: () => {},
};

/**
 * Authentication context
 */
const AuthContext = createContext(AuthContextType);

/**
 * Authentication provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize session management
        sessionManager.init({
          onWarning: handleSessionWarning,
          onExpired: handleSessionExpired,
        });

        const storedUser = authService.getUser();

        if (storedUser) {
          // Check if session is still valid (activity-based)
          if (!sessionManager.isSessionExpired()) {
            // For cookie-based auth, we assume user is authenticated if they have stored user data
            // The actual token validation happens on API calls
            setUser(storedUser);
            setToken(null); // Tokens are in httpOnly cookies
          } else {
            // Session expired, clear everything
            authService.clearAuth();
            setUser(null);
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially invalid auth data
        authService.clearAuth();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      sessionManager.cleanup();
    };
  }, []);

  /**
   * Handle session warning
   */
  const handleSessionWarning = (minutesLeft) => {
    setSessionWarning({
      show: true,
      minutesLeft,
      message: `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Click to extend your session.`,
    });
  };

  /**
   * Handle session expired
   */
  const handleSessionExpired = () => {
    setSessionWarning({
      show: true,
      expired: true,
      message: 'Your session has expired. Please log in again.',
    });

    // Clear auth state
    setUser(null);
    setToken(null);
    authService.clearAuth();

    // Don't navigate here - let the SessionWarning component handle it
  };

  /**
   * Login function
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setSessionWarning(null);

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        // Initialize session tracking for new login
        sessionManager.init({
          onWarning: handleSessionWarning,
          onExpired: handleSessionExpired,
        });

        setUser(result.user);
        setToken(null); // Tokens are in httpOnly cookies
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout function
   */
  const logout = async () => {
    setIsLoading(true);
    setSessionWarning(null);

    try {
      await authService.logout();
      setUser(null);
      setToken(null);

      // Cleanup session management
      sessionManager.cleanup();

      // Don't navigate here - let the component handle it
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user profile
   */
  const refreshProfile = async () => {
    // Extend session on profile refresh
    sessionManager.extendSession();

    try {
      const result = await authService.getProfile();
      if (result.success) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  /**
   * Extend session manually
   */
  const extendSession = () => {
    sessionManager.extendSession();
    setSessionWarning(null);
  };

  const value = {
    user,
    token: null, // Tokens are in httpOnly cookies
    isLoading,
    isAuthenticated: !!user, // Use user presence instead of token
    sessionWarning,
    login,
    logout,
    refreshProfile,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
