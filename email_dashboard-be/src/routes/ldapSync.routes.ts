import { Router } from 'express';
import { ldapSyncController } from '../controllers/ldapSync.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';

/**
 * LDAP Sync routes (Admin and Super Admin only)
 */
const router: Router = Router();

// Apply authentication and admin/super admin authorization to all routes
router.use(authenticateToken);
router.use(authorizeRoles(['admin', 'super admin']));

/**
 * @route   POST /api/ldap-sync/sync
 * @desc    Sync LDAP users to MongoDB
 * @access  Private (Admin only)
 */
router.post('/sync', ldapSyncController.syncUsers.bind(ldapSyncController));

/**
 * @route   GET /api/ldap-sync/users
 * @desc    Get all synced LDAP users from MongoDB
 * @access  Private (Admin only)
 */
router.get('/users', ldapSyncController.getSyncedUsers.bind(ldapSyncController));

/**
 * @route   PATCH /api/ldap-sync/users/:sAMAccountName
 * @desc    Update user role and active status
 * @access  Private (Admin only)
 */
router.patch(
  '/users/:sAMAccountName',
  ldapSyncController.updateUserStatus.bind(ldapSyncController)
);

/**
 * @route   DELETE /api/ldap-sync/users/:sAMAccountName
 * @desc    Delete an LDAP user (also deletes from UserManager)
 * @access  Private (Admin only)
 */
router.delete(
  '/users/:sAMAccountName',
  ldapSyncController.deleteUser.bind(ldapSyncController)
);

export default router;
