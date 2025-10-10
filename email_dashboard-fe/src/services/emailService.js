import { dashboardApi } from './index.js';

/**
 * Email service for email-related operations
 */
export class EmailService {
  /**
   * Get emails with optional filtering
   */
  async getEmails({ limit = 10, filter = 'all', search = '' } = {}) {
    try {
      const response = await dashboardApi.get(`/emails?limit=${limit}&filter=${filter}&search=${encodeURIComponent(search)}`);

      if (response.success) {
        return {
          success: true,
          emails: response.emails,
          total: response.total,
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
        message: error.message || 'Failed to fetch emails',
      };
    }
  }

  /**
   * Get single email by ID
   */
  async getEmail(emailId) {
    try {
      const response = await dashboardApi.get(`/emails/${emailId}`);

      if (response.success) {
        return {
          success: true,
          email: response.email,
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
        message: error.message || 'Failed to fetch email',
      };
    }
  }

  /**
   * Mark email as read/unread
   */
  async toggleEmailRead(emailId, read = true) {
    try {
      const response = await dashboardApi.patch(`/emails/${emailId}/read`, { read });

      if (response.success) {
        return {
          success: true,
          email: response.email,
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
        message: error.message || 'Failed to update email',
      };
    }
  }

  /**
   * Delete email
   */
  async deleteEmail(emailId) {
    try {
      const response = await dashboardApi.delete(`/emails/${emailId}`);

      if (response.success) {
        return {
          success: true,
          message: response.message,
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
        message: error.message || 'Failed to delete email',
      };
    }
  }

  /**
   * Send email (for future implementation)
   */
  async sendEmail(emailData) {
    try {
      const response = await dashboardApi.post('/emails/send', emailData);

      if (response.success) {
        return {
          success: true,
          message: response.message,
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
        message: error.message || 'Failed to send email',
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
