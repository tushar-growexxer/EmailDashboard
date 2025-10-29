import BaseApiService from './base.js';

/**
 * Authentication API service
 */
class AuthApiService extends BaseApiService {
  /**
   * Login user with email and password
   */
  async login(credentials) {
    return this.post('/auth/login', credentials);
  }

  /**
   * Login user with LDAP authentication
   */
  async loginLdap(credentials) {
    return this.post('/auth/ldap-login', credentials);
  }

  /**
   * Logout user
   */
  async logout() {
    return this.post('/auth/logout');
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    return this.get('/auth/profile');
  }

  /**
   * Update current user profile
   */
  async updateProfile(profileData) {
    return this.put('/auth/profile', profileData);
  }

  /**
   * Change current user password
   */
  async changePassword(passwordData) {
    return this.post('/auth/change-password', passwordData);
  }

  /**
   * Validate current token
   */
  async validateToken() {
    return this.get('/auth/validate');
  }

  /**
   * Refresh token (for future implementation)
   */
  async refreshToken() {
    return this.post('/auth/refresh');
  }
}

// Export singleton instance
const authApi = new AuthApiService();
export { AuthApiService };
export default authApi;
