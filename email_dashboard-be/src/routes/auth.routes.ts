import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { ldapService } from '../services/ldap.service';
import logger from '../config/logger';

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
 * @route   POST /api/auth/ldap-login
 * @desc    Authenticate user via LDAP and return JWT token
 * @access  Public
 */
router.post('/ldap-login', authController.ldapLogin.bind(authController));

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
 * @route   GET /api/auth/ldap-test
 * @desc    Test LDAP connection (debugging endpoint)
 * @access  Private (for now, can be made public for testing)
 */
router.get('/ldap-test', authenticateToken, async (_req, res) => {
  try {
    const isConnected = await ldapService.testConnection();
    res.status(200).json({
      success: true,
      message: 'LDAP test completed',
      connected: isConnected,
    });
  } catch (error) {
    logger.error('LDAP test failed:', error);
    res.status(500).json({
      success: false,
      message: 'LDAP test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
