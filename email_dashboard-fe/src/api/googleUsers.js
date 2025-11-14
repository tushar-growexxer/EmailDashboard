import BaseApiService from './base.js';

/**
 * Google Users API Service
 * Handles Google user management operations
 */
class GoogleUsersApiService extends BaseApiService {
  /**
   * Get all Google users from MongoDB
   * @param {boolean} forceRefresh - Force refresh from database, bypassing cache
   * @returns {Promise<Object>} List of Google users
   */
  async getGoogleUsers(forceRefresh = false) {
    try {
      const endpoint = forceRefresh ? '/google-users?refresh=true' : '/google-users';
      const response = await this.get(endpoint);
      return {
        success: true,
        users: response.users || [],
        count: response.count || 0,
      };
    } catch (error) {
      console.error('Get Google users failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to get Google users',
        users: [],
        count: 0,
      };
    }
  }

  /**
   * Update Google user role, active status, and manager
   * @param {string} googleId - User's Google ID
   * @param {Object} updates - Updates to apply
   * @param {string} [updates.role] - User role (user, admin)
   * @param {boolean} [updates.isActive] - User active status
   * @param {Object|Array} [updates.manager] - Manager(s) assigned to user
   * @returns {Promise<Object>} Update result
   */
  async updateGoogleUser(googleId, updates) {
    try {
      const response = await this.patch(`/google-users/${googleId}`, updates);
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('Update Google user failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to update Google user',
      };
    }
  }

  /**
   * Delete a Google user by Google ID
   * Also deletes from UserManager collection
   * @param {string} googleId - User's Google ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteGoogleUser(googleId) {
    try {
      const response = await this.delete(`/google-users/${googleId}`);
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('Delete Google user failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete Google user',
      };
    }
  }
}

// Export singleton instance
const googleUsersApi = new GoogleUsersApiService();
export default googleUsersApi;
export { GoogleUsersApiService };

