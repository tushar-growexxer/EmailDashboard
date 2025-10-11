/**
 * Cookie-based token management utilities
 * Note: With httpOnly cookies, we cannot directly access tokens from JavaScript
 * Authentication status must be verified through API calls
 */
export class TokenManager {
  static TOKEN_KEY = 'auth_token';
  static USER_KEY = 'user';
  static REFRESH_TOKEN_KEY = 'refresh_token';

  // 30 minutes in seconds for JWT expiration
  static TOKEN_EXPIRY_SECONDS = 30 * 60;

  /**
   * Store user data in localStorage (tokens are in httpOnly cookies)
   */
  static setUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * Get stored user data
   */
  static getUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  /**
   * Remove user data
   */
  static removeUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  /**
   * Store refresh token (for future implementation)
   */
  static setRefreshToken(refreshToken) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Get refresh token
   */
  static getRefreshToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Remove refresh token
   */
  static removeRefreshToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Clear only local storage data (without calling logout API)
   * Use this for cleaning up invalid/old sessions
   */
  static clearLocalData() {
    this.removeUser();
    this.removeRefreshToken();
    // Also clear session_start that might be set by this manager
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session_start');
    }
  }

  /**
   * Clear all authentication data (including server-side cookies)
   * Use this for actual user logout
   */
  static async clearAuth() {
    this.removeUser();
    this.removeRefreshToken();

    // Clear cookies by calling logout endpoint
    await this.clearAuthCookies();
  }

  /**
   * Clear authentication cookies by calling logout endpoint
   */
  static async clearAuthCookies() {
    try {
      // Call logout endpoint to clear httpOnly cookies
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies in request
      });
    } catch (error) {
      console.error('Error clearing auth cookies:', error);
    }
  }

  /**
   * Check if user data exists (tokens are in httpOnly cookies)
   */
  static hasUser() {
    return !!this.getUser();
  }

  /**
   * Check if user is authenticated (has user data)
   */
  static isAuthenticated() {
    return this.hasUser();
  }

  /**
   * Get token expiration time (for UI display purposes)
   * Note: Actual token expiration is handled server-side
   */
  static getTokenExpirationTime() {
    // Since we can't access the actual token, we'll use a default session time
    const user = this.getUser();
    if (!user) return 0;

    // Assume 30-minute sessions
    const sessionStart = localStorage.getItem('session_start');
    if (!sessionStart) return 0;

    const startTime = parseInt(sessionStart, 10);
    const sessionDuration = 30 * 60 * 1000; // 30 minutes
    return Math.max(0, startTime + sessionDuration - Date.now());
  }

  /**
   * Set session start time
   */
  static setSessionStart() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_start', Date.now().toString());
    }
  }

  /**
   * Get session time until expiry (in milliseconds)
   */
  static getSessionTimeUntilExpiry() {
    return this.getTokenExpirationTime();
  }
}

// Export singleton instance for convenience
export const tokenManager = TokenManager;
