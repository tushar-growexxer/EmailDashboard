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
  logout: async () => { },
  refreshProfile: async () => { },
  extendSession: () => { },
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
        const storedUser = authService.getUser();

        // Initialize session management FIRST before any checks
        // This ensures timestamps are set properly
        sessionManager.init({
          onWarning: handleSessionWarning,
          onExpired: handleSessionExpired,
        });

        if (storedUser) {
          // For cookie-based auth, trust the stored user data
          // The backend will validate the actual token on API calls
          // Session expiry will be checked by the background interval
          setUser(storedUser);
          setToken(null); // Tokens are in httpOnly cookies
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially invalid auth data
        authService.clearLocalData(); // Only clears localStorage, doesn't call logout API
        sessionManager.clearSession();
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

    // Clear auth state (only localStorage, session already expired on server)
    setUser(null);
    setToken(null);
    authService.clearLocalData(); // Don't call logout API, session already expired

    // Don't navigate here - let the SessionWarning component handle it
  };

  /**
   * Login function
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setSessionWarning(null);

    try {
      let result;

      // Check if this is an LDAP login (contains @matangi.com)
      if (email.includes('@matangi.com')) {
        result = await authService.loginLdap(email, password);
      } else {
        result = await authService.login(email, password);
      }

      if (result.success) {
        setUser(result.user);
        setToken(null); // Tokens are in httpOnly cookies

        // Timestamps are already set in authService.login
        // Just ensure session manager knows about them
        sessionManager.updateLastActivity();

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
      // Clear local state immediately
      setUser(null);
      setToken(null);

      // Call backend logout to clear cookies
      await authService.logout();

      // Clear session management data
      sessionManager.clearSession();

    } catch (error) {
      // Even if logout API fails, clear local state
      setUser(null);
      setToken(null);
      authService.clearLocalData();
      sessionManager.clearSession();
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
