import { Request, Response } from 'express';
import logger from '../config/logger';
import { googleAuthService } from '../services/googleAuth.service';

/**
 * Onboarding Controller
 * Handles user onboarding operations
 */
export class OnboardingController {
  /**
   * Initiate Gmail sync OAuth flow
   * Redirects user to Google OAuth to grant Gmail permissions
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async completeOnboarding(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userId = req.user.userId;
      const userEmail = req.user.email;

      logger.info(`Initiating Gmail sync for user: ${userEmail} (${userId})`);

      // Check if this is a Google user
      const isGoogleUser = typeof userId === 'string' && userId.startsWith('google_');

      if (isGoogleUser) {
        // Extract Google ID
        const googleId = userId.replace('google_', '');
        
        // Mark onboarding as complete (user clicked sync button)
        await googleAuthService.completeOnboarding(googleId);
        
        // Redirect to Gmail sync OAuth endpoint
        const apiBaseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000';
        const syncUrl = `${apiBaseUrl}/api/v1/auth/google/sync`;
        
        logger.info(`Redirecting to Gmail sync OAuth: ${syncUrl}`);
        res.status(200).json({
          success: true,
          message: 'Redirecting to Gmail authorization',
          redirectUrl: syncUrl,
        });
      } else {
        // For LDAP or regular users, we don't track onboarding yet
        // This can be implemented later if needed
        logger.info(`Onboarding completed for non-Google user: ${userEmail}`);
        res.status(200).json({
          success: true,
          message: 'Onboarding completed successfully',
        });
      }
    } catch (error) {
      logger.error('Error initiating onboarding sync:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Gmail sync',
      });
    }
  }

  /**
   * Skip onboarding (user clicked skip button)
   * Sets hasCompletedOnboarding to true but does NOT set hasSynced
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async skipOnboarding(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userId = req.user.userId;
      const userEmail = req.user.email;

      logger.info(`Skipping onboarding for user: ${userEmail} (${userId})`);

      // Check if this is a Google user
      const isGoogleUser = typeof userId === 'string' && userId.startsWith('google_');

      if (isGoogleUser) {
        // Extract Google ID
        const googleId = userId.replace('google_', '');
        
        // Mark onboarding as complete (skip button clicked) but NOT synced
        await googleAuthService.completeOnboarding(googleId);
        
        logger.info(`Onboarding skipped for Google user: ${userEmail}`);
        res.status(200).json({
          success: true,
          message: 'Onboarding skipped successfully',
        });
      } else {
        // For LDAP or regular users
        logger.info(`Onboarding skipped for non-Google user: ${userEmail}`);
        res.status(200).json({
          success: true,
          message: 'Onboarding skipped successfully',
        });
      }
    } catch (error) {
      logger.error('Error skipping onboarding:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to skip onboarding',
      });
    }
  }
}

// Export singleton instance
export const onboardingController = new OnboardingController();
export default onboardingController;
