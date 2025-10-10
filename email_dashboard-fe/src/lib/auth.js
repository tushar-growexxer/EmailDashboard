import { authApi } from '../api/index.js';
import { tokenManager } from './tokenManager.js';

/**
 * Authentication service for cookie-based login/logout operations
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
        // Store user data in localStorage (tokens are in httpOnly cookies)
        tokenManager.setUser(response.user);
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

      // Clear local storage
      tokenManager.clearAuth();

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      // Even if the API call fails, we should clear local storage
      tokenManager.clearAuth();

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
        // Update stored user data
        tokenManager.setUser(response.user);

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
        // Update user data if needed
        if (response.user) {
          tokenManager.setUser(response.user);
        }

        return {
          success: true,
          user: response.user,
        };
      } else {
        // Clear local data if validation fails
        tokenManager.clearAuth();
        return {
          success: false,
          message: response.message,
        };
      }
    } catch (error) {
      // Clear local data if validation fails
      tokenManager.clearAuth();
      return {
        success: false,
        message: error.message || 'Authentication validation failed',
      };
    }
  }

  /**
   * Get stored user data
   */
  getUser() {
    return tokenManager.getUser();
  }

  /**
   * Check if user is authenticated (has user data)
   */
  isAuthenticated() {
    return tokenManager.isAuthenticated();
  }

  /**
   * Clear all authentication data
   */
  clearAuth() {
    tokenManager.clearAuth();
  }

  /**
   * Get session time until expiry
   */
  getSessionTimeUntilExpiry() {
    return tokenManager.getSessionTimeUntilExpiry();
  }
}

// Export singleton instance
export const authService = new AuthService();
