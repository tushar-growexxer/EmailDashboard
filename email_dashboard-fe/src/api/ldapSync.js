import BaseApiService from './base.js';

/**
 * LDAP Sync API Service
 * Handles LDAP user synchronization operations
 */
class LdapSyncApiService extends BaseApiService {
  /**
   * Sync LDAP users to MongoDB
   * @returns {Promise<Object>} Sync result with counts
   */
  async syncUsers() {
    try {
      const response = await this.post('/ldap-sync/sync');
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('Sync LDAP users failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to sync LDAP users',
      };
    }
  }

  /**
   * Get all synced LDAP users from MongoDB
   * @param {boolean} forceRefresh - Force refresh from database, bypassing cache
   * @returns {Promise<Object>} List of synced users
   */
  async getSyncedUsers(forceRefresh = false) {
    try {
      const endpoint = forceRefresh ? '/ldap-sync/users?refresh=true' : '/ldap-sync/users';
      const response = await this.get(endpoint);
      return {
        success: true,
        users: response.users || [],
        count: response.count || 0,
        cached: response.cached,
      };
    } catch (error) {
      console.error('Get synced users failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to get synced users',
        users: [],
        count: 0,
      };
    }
  }

  /**
   * Update user role and active status
   * @param {string} sAMAccountName - User's sAMAccountName
   * @param {Object} updates - Updates to apply
   * @param {string} [updates.role] - User role (user, manager, admin)
   * @param {boolean} [updates.isActive] - User active status
   * @returns {Promise<Object>} Update result
   */
  async updateUserStatus(sAMAccountName, updates) {
    try {
      const response = await this.patch(`/ldap-sync/users/${sAMAccountName}`, updates);
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('Update user status failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to update user status',
      };
    }
  }

  /**
   * Delete an LDAP user
   * Also deletes the user from UserManager (OAuth tokens)
   * @param {string} sAMAccountName - User's sAMAccountName
   * @returns {Promise<Object>} Delete result
   */
  async deleteLdapUser(sAMAccountName) {
    try {
      const response = await this.delete(`/ldap-sync/users/${sAMAccountName}`);
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('Delete LDAP user failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete LDAP user',
      };
    }
  }
}

// Export singleton instance
const ldapSyncApi = new LdapSyncApiService();
export default ldapSyncApi;
export { LdapSyncApiService };
