import { Router } from 'express';
import { googleUsersController } from '../controllers/googleUsers.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';

/**
 * Google Users routes (Admin and Super Admin only)
 */
const router: Router = Router();

// Apply authentication and admin/super admin authorization to all routes
router.use(authenticateToken);
router.use(authorizeRoles(['admin', 'super admin']));

/**
 * @route   GET /api/google-users
 * @desc    Get all Google users from MongoDB
 * @access  Private (Admin only)
 */
router.get('/', googleUsersController.getGoogleUsers.bind(googleUsersController));

/**
 * @route   PATCH /api/google-users/:googleId
 * @desc    Update Google user role, active status, and manager
 * @access  Private (Admin only)
 */
router.patch(
  '/:googleId',
  googleUsersController.updateGoogleUser.bind(googleUsersController)
);

/**
 * @route   DELETE /api/google-users/:googleId
 * @desc    Delete a Google user by Google ID (also deletes from UserManager)
 * @access  Private (Admin only)
 */
router.delete(
  '/:googleId',
  googleUsersController.deleteGoogleUser.bind(googleUsersController)
);

export default router;

