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
   * Filters based on user role:
   * - Super admin: sees all users
   * - Admin: sees only users from their domain, excluding super admins
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getSyncedUsers(req: Request, res: Response): Promise<void> {
    try {
      // Check if force refresh is requested
      const forceRefresh = req.query.refresh === 'true';
      
      const currentUser = req.user;
      let users = await ldapSyncService.getSyncedUsers(forceRefresh);

      // Filter based on user role
      if (currentUser?.role === 'admin') {
        // Extract admin's domain from their email
        const adminDomain = currentUser.email.split('@')[1];
        
        // Filter: only show users from same domain and exclude super admins
        users = users.filter(user => {
          const userEmail = user.mail || user.userPrincipalName || '';
          const userDomain = userEmail.split('@')[1];
          return userDomain === adminDomain && user.role !== 'super admin';
        });
      }
      // Super admins see all users (no filtering needed)

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
      const { role, isActive, manager } = req.body;

      // Validate inputs
      if (!sAMAccountName) {
        res.status(400).json({
          success: false,
          message: 'sAMAccountName is required',
        });
        return;
      }

      if (role && !['user', 'manager', 'admin', 'super admin'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role. Must be user, manager, admin, or super admin',
        });
        return;
      }

      // Role assignment restrictions
      const currentUserRole = req.user?.role;
      
      if (role === 'super admin' && currentUserRole !== 'super admin') {
        res.status(403).json({
          success: false,
          message: 'Only super admins can assign the super admin role',
        });
        return;
      }

      // Admins can only assign user, manager, or admin roles
      if (currentUserRole === 'admin' && role === 'super admin') {
        res.status(403).json({
          success: false,
          message: 'Admins cannot assign the super admin role',
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

      const updates: {
        role?: 'user' | 'manager' | 'admin' | 'super admin';
        isActive?: boolean;
        manager?: any;
      } = {};
      if (role) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;
      if (manager !== undefined) updates.manager = manager;

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

  /**
   * Delete an LDAP user
   * Also deletes the user from UserManager
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { sAMAccountName } = req.params;

      // Validate inputs
      if (!sAMAccountName) {
        res.status(400).json({
          success: false,
          message: 'sAMAccountName is required',
        });
        return;
      }

      // Prevent user from deleting themselves
      const currentUserId = req.user?.userId;
      if (currentUserId && typeof currentUserId === 'string' && currentUserId === `ldap_${sAMAccountName}`) {
        res.status(400).json({
          success: false,
          message: 'You cannot delete your own account',
        });
        return;
      }

      // Delete the user (this will also delete from UserManager)
      const deleted = await ldapSyncService.deleteUser(sAMAccountName);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Delete LDAP user API error:', error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete user',
      });
    }
  }
}

// Export singleton instance
export const ldapSyncController = new LdapSyncController();
export default ldapSyncController;
