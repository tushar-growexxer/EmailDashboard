import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

/**
 * Authentication routes
 */
const router: Router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, userController.updateProfile.bind(userController));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change current user password
 * @access  Private
 */
router.post('/change-password', authenticateToken, userController.changePassword.bind(userController));

/**
 * @route   GET /api/auth/validate
 * @desc    Validate JWT token
 * @access  Private
 */
router.get('/validate', authenticateToken, authController.validateToken.bind(authController));

export default router;
