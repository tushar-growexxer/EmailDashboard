import { Router } from 'express';
import { ldapSyncController } from '../controllers/ldapSync.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

/**
 * LDAP Sync routes (Admin only)
 */
const router: Router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(requireAdmin);

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

export default router;
