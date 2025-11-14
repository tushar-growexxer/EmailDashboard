import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';

/**
 * User management routes (Admin and Super Admin only)
 */
const router: Router = Router();

// Apply authentication and admin/super admin authorization to all routes
router.use(authenticateToken);
router.use(authorizeRoles(['admin', 'super admin']));

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin only)
 */
router.post('/', userController.createUser.bind(userController));

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', userController.getAllUsers.bind(userController));

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', userController.getUserById.bind(userController));

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user by ID
 * @access  Private (Admin only)
 */
router.put('/:id', userController.updateUser.bind(userController));

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user by ID
 * @access  Private (Admin only)
 */
router.delete('/:id', userController.deleteUser.bind(userController));

/**
 * @route   PATCH /api/users/:id/reset-password
 * @desc    Reset user password (Admin only, does not require current password)
 * @access  Private (Admin only)
 */
router.patch('/:id/reset-password', userController.resetUserPassword.bind(userController));

export default router;
