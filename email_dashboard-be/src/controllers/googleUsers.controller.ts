import { Request, Response } from 'express';
import { googleAuthService } from '../services/googleAuth.service';
import logger from '../config/logger';

/**
 * Google Users Controller
 */
export class GoogleUsersController {
  /**
   * Get all Google users from MongoDB
   * Filters based on user role:
   * - Super admin: sees all users
   * - Admin: sees only users from their domain, excluding super admins
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getGoogleUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user;
      let users = await googleAuthService.getAllUsers();

      // Filter based on user role
      if (currentUser?.role === 'admin') {
        // Extract admin's domain from their email
        const adminDomain = currentUser.email.split('@')[1];
        
        // Filter: only show users from same domain and exclude super admins
        users = users.filter(user => {
          const userDomain = user.email.split('@')[1];
          return userDomain === adminDomain && user.role !== 'super admin';
        });
      }
      // Super admins see all users (no filtering needed)

      res.status(200).json({
        success: true,
        users,
        count: users.length,
      });
    } catch (error) {
      logger.error('Get Google users API error:', error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get Google users',
      });
    }
  }

  /**
   * Update Google user status (role, active status, manager)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async updateGoogleUser(req: Request, res: Response): Promise<void> {
    try {
      logger.info('[UPDATE-USER] ========== Update Google User Request ==========');
      const { googleId } = req.params;
      const { role, isActive, manager } = req.body;
      
      logger.info(`[UPDATE-USER] Google ID: ${googleId}`);
      logger.info(`[UPDATE-USER] Requested by: ${req.user?.email} (${req.user?.userId})`);
      logger.info(`[UPDATE-USER] Requester role: ${req.user?.role}`);
      logger.info(`[UPDATE-USER] Update data:`, { role, isActive, manager });

      // Validate inputs
      if (!googleId) {
        logger.warn('[UPDATE-USER] Missing googleId parameter');
        res.status(400).json({
          success: false,
          message: 'googleId is required',
        });
        return;
      }

      if (role && !['user', 'manager', 'admin', 'super admin'].includes(role)) {
        logger.warn(`[UPDATE-USER] Invalid role: ${role}`);
        res.status(400).json({
          success: false,
          message: 'Invalid role. Must be user, manager, admin, or super admin',
        });
        return;
      }

      // Role assignment restrictions
      const currentUserRole = req.user?.role;
      logger.info(`[UPDATE-USER] Checking role assignment permissions...`);
      
      if (role === 'super admin' && currentUserRole !== 'super admin') {
        logger.warn(`[UPDATE-USER] Non-super admin (${currentUserRole}) attempted to assign super admin role`);
        res.status(403).json({
          success: false,
          message: 'Only super admins can assign the super admin role',
        });
        return;
      }

      // Admins can only assign user, manager, or admin roles
      if (currentUserRole === 'admin' && role === 'super admin') {
        logger.warn('[UPDATE-USER] Admin attempted to assign super admin role');
        res.status(403).json({
          success: false,
          message: 'Admins cannot assign the super admin role',
        });
        return;
      }

      if (isActive !== undefined && typeof isActive !== 'boolean') {
        logger.warn(`[UPDATE-USER] Invalid isActive value: ${isActive} (type: ${typeof isActive})`);
        res.status(400).json({
          success: false,
          message: 'isActive must be a boolean',
        });
        return;
      }

      const updates: {
        role?: 'admin' | 'user' | 'manager' | 'super admin';
        isActive?: boolean;
        manager?: any;
      } = {};
      if (role) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;
      if (manager !== undefined) updates.manager = manager;

      logger.info('[UPDATE-USER] Validation passed, calling googleAuthService.updateUser()...');
      logger.info('[UPDATE-USER] Updates to apply:', updates);
      
      const updated = await googleAuthService.updateUser(googleId, updates);
      logger.info(`[UPDATE-USER] Update result: ${updated}`);

      if (!updated) {
        logger.warn(`[UPDATE-USER] User not found or no changes made for googleId: ${googleId}`);
        res.status(404).json({
          success: false,
          message: 'User not found or no changes made',
        });
        return;
      }

      logger.info('[UPDATE-USER] ✓ User updated successfully');
      logger.info('[UPDATE-USER] ========== Update Complete ==========');
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
      });
    } catch (error) {
      logger.error('[UPDATE-USER] ========== Update User Error ==========');
      logger.error('[UPDATE-USER] Error details:', error);
      if (error instanceof Error) {
        logger.error(`[UPDATE-USER] Error message: ${error.message}`);
        logger.error(`[UPDATE-USER] Error stack: ${error.stack}`);
      }

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update user',
      });
    }
  }

  /**
   * Delete a Google user by Google ID
   * Also deletes the user from UserManager collection
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async deleteGoogleUser(req: Request, res: Response): Promise<void> {
    try {
      logger.info('[DELETE-USER] ========== Delete Google User Request ==========');
      const { googleId } = req.params;
      logger.info(`[DELETE-USER] Google ID: ${googleId}`);
      logger.info(`[DELETE-USER] Requested by: ${req.user?.email} (${req.user?.userId})`);
      logger.info(`[DELETE-USER] Requester role: ${req.user?.role}`);

      // Validate inputs
      if (!googleId) {
        logger.warn('[DELETE-USER] Missing googleId parameter');
        res.status(400).json({
          success: false,
          message: 'googleId is required',
        });
        return;
      }

      // Prevent user from deleting themselves
      const currentUserId = req.user?.userId;
      logger.info(`[DELETE-USER] Checking if user is deleting themselves...`);
      logger.info(`[DELETE-USER] Current user ID: ${currentUserId}`);
      logger.info(`[DELETE-USER] Target user ID: google_${googleId}`);
      
      if (currentUserId && typeof currentUserId === 'string' && currentUserId === `google_${googleId}`) {
        logger.warn('[DELETE-USER] User attempted to delete their own account');
        res.status(400).json({
          success: false,
          message: 'You cannot delete your own account',
        });
        return;
      }

      logger.info('[DELETE-USER] Validation passed, proceeding with deletion...');
      logger.info('[DELETE-USER] Calling googleAuthService.deleteUser()...');
      
      // Delete the user (this will also delete from UserManager)
      const deleted = await googleAuthService.deleteUser(googleId);
      logger.info(`[DELETE-USER] Delete operation result: ${deleted}`);

      if (!deleted) {
        logger.warn(`[DELETE-USER] User not found with googleId: ${googleId}`);
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      logger.info('[DELETE-USER] ✓ User deleted successfully');
      logger.info('[DELETE-USER] ========== Delete Complete ==========');
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('[DELETE-USER] ========== Delete User Error ==========');
      logger.error('[DELETE-USER] Error details:', error);
      if (error instanceof Error) {
        logger.error(`[DELETE-USER] Error message: ${error.message}`);
        logger.error(`[DELETE-USER] Error stack: ${error.stack}`);
      }

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
export const googleUsersController = new GoogleUsersController();
export default googleUsersController;

