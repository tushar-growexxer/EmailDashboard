import BaseApiService from './base.js';

/**
 * Dashboard API service
 */
class DashboardApiService extends BaseApiService {
  /**
   * Get dashboard statistics
   */
  async getStatistics() {
    return this.get('/dashboard/statistics');
  }

  /**
   * Get recent emails
   */
  async getRecentEmails(limit = 10) {
    return this.get(`/dashboard/emails?limit=${limit}`);
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(timeframe = '7d') {
    return this.get(`/dashboard/analytics?timeframe=${timeframe}`);
  }

  /**
   * Get user activity
   */
  async getUserActivity() {
    return this.get('/dashboard/activity');
  }

  /**
   * Mark email as read/unread
   */
  async toggleEmailRead(emailId, read = true) {
    return this.patch(`/dashboard/emails/${emailId}/read`, { read });
  }

  /**
   * Delete email
   */
  async deleteEmail(emailId) {
    return this.delete(`/dashboard/emails/${emailId}`);
  }
}

// Export singleton instance
const dashboardApi = new DashboardApiService();
export { DashboardApiService };
export default dashboardApi;
