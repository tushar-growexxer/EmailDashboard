import { Request, Response } from 'express';
import { ldapSyncService } from '../services/ldapSync.service';
import logger from '../config/logger';

/**
 * LDAP Sync Controller
 */
export class LdapSyncController {
  /**
   * Sync LDAP users to MongoDB
   * @param {Request} _req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async syncUsers(_req: Request, res: Response): Promise<void> {
    try {
      logger.info('Starting LDAP user sync via API...');

      const result = await ldapSyncService.syncUsersToMongoDB();

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          totalUsers: result.totalUsers,
          usersAdded: result.usersAdded,
          usersUpdated: result.usersUpdated,
        },
      });
    } catch (error) {
      logger.error('LDAP sync API error:', error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to sync LDAP users',
      });
    }
  }

  /**
   * Get all synced LDAP users from MongoDB
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getSyncedUsers(req: Request, res: Response): Promise<void> {
    try {
      // Check if force refresh is requested
      const forceRefresh = req.query.refresh === 'true';
      
      const users = await ldapSyncService.getSyncedUsers(forceRefresh);

      res.status(200).json({
        success: true,
        users,
        count: users.length,
        cached: !forceRefresh,
      });
    } catch (error) {
      logger.error('Get synced users API error:', error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get synced users',
      });
    }
  }

  /**
   * Update user role and active status
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { sAMAccountName } = req.params;
      const { role, isActive } = req.body;

      // Validate inputs
      if (!sAMAccountName) {
        res.status(400).json({
          success: false,
          message: 'sAMAccountName is required',
        });
        return;
      }

      if (role && !['user', 'manager', 'admin'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role. Must be user, manager, or admin',
        });
        return;
      }

      if (isActive !== undefined && typeof isActive !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'isActive must be a boolean',
        });
        return;
      }

      const updates: { role?: 'user' | 'manager' | 'admin'; isActive?: boolean } = {};
      if (role) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;

      const updated = await ldapSyncService.updateUserStatus(
        sAMAccountName,
        updates
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'User not found or no changes made',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
      });
    } catch (error) {
      logger.error('Update user status API error:', error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update user status',
      });
    }
  }
}

// Export singleton instance
export const ldapSyncController = new LdapSyncController();
export default ldapSyncController;
