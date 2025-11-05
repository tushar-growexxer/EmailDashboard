import BaseApiService from "./base.js";

/**
 * Dashboard API service for MongoDB-backed analytics
 *
 * This service provides access to email analytics data stored in MongoDB
 * with intelligent caching on the backend (24-hour cache, auto-refresh at 7:30 AM)
 */
class DashboardApiService extends BaseApiService {
  /**
   * Health check for MongoDB connection
   * @returns {Promise<Object>} MongoDB connection status
   */
  async healthCheck() {
    return this.get("/dashboard/health");
  }

  /**
   * Get Response Dashboard data (unreplied emails by category)
   * Cached on backend for 24 hours
   * @returns {Promise<Object>} Response dashboard data for all users
   */
  async getResponseDashboard() {
    return this.get("/dashboard/response");
  }

  /**
   * Get Aging Dashboard data (email aging analysis)
   * Cached on backend for 24 hours
   * @returns {Promise<Object>} Aging dashboard data for all users
   */
  async getAgingDashboard() {
    return this.get("/dashboard/aging");
  }

  /**
   * Get Response Dashboard data for specific user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Response dashboard data for specific user
   */
  async getResponseDashboardByUser(userId) {
    return this.get(`/dashboard/response/user/${userId}`);
  }

  /**
   * Get Aging Dashboard data for specific user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Aging dashboard data for specific user
   */
  async getAgingDashboardByUser(userId) {
    return this.get(`/dashboard/aging/user/${userId}`);
  }

  /**
   * Get Sentiment Dashboard data (Dashboard 3)
   * Includes daily, weekly, and user domain sentiment scores
   * Cached on backend for 24 hours
   * @returns {Promise<Object>} Sentiment dashboard data
   */
  async getSentimentDashboard() {
    return this.get("/dashboard/sentiment");
  }

  /**
   * Manually refresh cache (admin only)
   * Forces a fresh fetch from MongoDB and updates cache
   * @returns {Promise<Object>} Refresh confirmation
   */
  async refreshCache() {
    return this.post("/dashboard/refresh-cache");
  }

  /**
   * Get cache status and statistics
   * @returns {Promise<Object>} Cache status information
   */
  async getCacheStatus() {
    return this.get("/dashboard/cache-status");
  }

  // Legacy endpoints (keeping for backward compatibility)

  /**
   * Get dashboard statistics
   * @deprecated Use getResponseDashboard() or getAgingDashboard() instead
   */
  async getStatistics() {
    return this.get("/dashboard/statistics");
  }

  /**
   * Get recent emails
   * @deprecated Use getResponseDashboard() instead
   */
  async getRecentEmails(limit = 10) {
    return this.get(`/dashboard/emails?limit=${limit}`);
  }

  /**
   * Get email analytics
   * @deprecated Use getResponseDashboard() or getAgingDashboard() instead
   */
  async getEmailAnalytics(timeframe = "7d") {
    return this.get(`/dashboard/analytics?timeframe=${timeframe}`);
  }

  /**
   * Get user activity
   * @deprecated
   */
  async getUserActivity() {
    return this.get("/dashboard/activity");
  }

  /**
   * Mark email as read/unread
   * @deprecated
   */
  async toggleEmailRead(emailId, read = true) {
    return this.patch(`/dashboard/emails/${emailId}/read`, { read });
  }

  /**
   * Delete email
   * @deprecated
   */
  async deleteEmail(emailId) {
    return this.delete(`/dashboard/emails/${emailId}`);
  }
}

// Export singleton instance
const dashboardApi = new DashboardApiService();
export { DashboardApiService };
export default dashboardApi;
