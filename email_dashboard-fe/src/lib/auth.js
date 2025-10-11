import { authApi } from '../api/index.js';
import { tokenManager } from './tokenManager.js';

/**
 * Authentication service for cookie-based login/logout operations
 * Note: No user data is stored locally - authentication state is determined by API calls
 */
export class AuthService {
  /**
   * Login user with email and password
   * Server will set httpOnly cookies with the JWT token
   */
  async login(email, password) {
    try {
      const response = await authApi.login({
        email,
        password,
      });

      if (response.success) {
        // Store user data in localStorage for session management
        tokenManager.setUser(response.user);
        
        // Store session start time for activity tracking
        tokenManager.setSessionStart();

        return {
          success: true,
          user: response.user, // Return user data for immediate UI update
        };
      } else {
        return {
          success: false,
          message: response.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      };
    }
  }

  /**
   * Logout user
   * Server will clear httpOnly cookies
   */
  async logout() {
    try {
      // Call logout endpoint to clear httpOnly cookies
      await authApi.logout();

      // Clear local storage only (API already cleared cookies)
      tokenManager.clearLocalData();

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      // Even if the API call fails, we should clear local storage
      tokenManager.clearLocalData();

      return {
        success: true,
        message: 'Logout successful',
      };
    }
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const response = await authApi.getProfile();

      if (response.success) {
        // Update session activity
        tokenManager.setSessionStart();

        return {
          success: true,
          user: response.user,
        };
      } else {
        return {
          success: false,
          message: response.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get profile',
      };
    }
  }

  /**
   * Validate current authentication status
   * Makes an API call to verify if the user is still authenticated
   */
  async validateAuth() {
    try {
      const response = await authApi.validateToken();

      if (response.success) {
        // Update session activity
        tokenManager.setSessionStart();

        return {
          success: true,
          user: response.user,
        };
      } else {
        // Expected when no valid authentication exists
        return {
          success: false,
          message: response.message,
        };
      }
    } catch (error) {
      // Expected when no cookies are present or authentication fails
      if (error.message && error.message.includes('401')) {
        // Authentication not available (no cookies) - this is normal
        return {
          success: false,
          message: 'No authentication available',
        };
      }

      // Other errors (network, server down, etc.)
      console.error('Auth validation error:', error);
      return {
        success: false,
        message: error.message || 'Authentication validation failed',
      };
    }
  }

  /**
   * Get session time until expiry
   */
  getSessionTimeUntilExpiry() {
    return tokenManager.getSessionTimeUntilExpiry();
  }

  /**
   * Get stored user data from localStorage
   */
  getUser() {
    return tokenManager.getUser();
  }

  /**
   * Store user data in localStorage
   */
  setUser(user) {
    tokenManager.setUser(user);
  }

  /**
   * Clear only local storage data (without calling logout API)
   */
  clearLocalData() {
    tokenManager.clearLocalData();
  }

  /**
   * Clear all authentication data (including server-side cookies)
   */
  async clearAuth() {
    await tokenManager.clearAuth();
  }
}

// Export singleton instance
export const authService = new AuthService();
