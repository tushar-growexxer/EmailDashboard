import BaseApiService from './base.js';

/**
 * User management API service (Admin only)
 */
class UserApiService extends BaseApiService {
  /**
   * Get all users
   */
  async getAllUsers() {
    return this.get('/users');
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId) {
    return this.get(`/users/${userId}`);
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    return this.post('/users', userData);
  }

  /**
   * Update a user by ID
   */
  async updateUser(userId, userData) {
    return this.put(`/users/${userId}`, userData);
  }

  /**
   * Delete a user by ID
   */
  async deleteUser(userId) {
    return this.delete(`/users/${userId}`);
  }

  /**
   * Reset user password (Admin only)
   */
  async resetUserPassword(userId, newPassword) {
    return this.patch(`/users/${userId}/reset-password`, { newPassword });
  }
}

// Export singleton instance
const userApi = new UserApiService();
export { UserApiService };
export default userApi;

