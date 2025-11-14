import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { ldapService } from '../services/ldap.service';
import logger from '../config/logger';
import passport from '../config/passport';

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
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 * @query   prompt - Optional: 'select_account' to show account chooser
 */
router.get('/google', (req, res, next) => {
  const prompt = req.query.prompt as string | undefined;
  const authOptions: any = {
    scope: [
      'openid', // Required for OpenID Connect
      'profile', // User profile information
      'email', // User email address
    ],
    session: false,
    prompt: 'consent', // Force consent screen to show permissions
    accessType: 'offline', // Request refresh token
  };
  
  // Override prompt if provided (e.g., 'select_account' to show account chooser)
  if (prompt) {
    authOptions.prompt = prompt;
  }
  
  passport.authenticate('google', authOptions)(req, res, next);
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback for login flow
 * @access  Public
 */
router.get('/google/callback', authController.googleCallback.bind(authController));

/**
 * @route   GET /api/auth/google/sync
 * @desc    Initiate Google OAuth for Gmail sync (with Gmail scopes)
 * @access  Private (requires authentication)
 */
router.get('/google/sync', authenticateToken, authController.googleSync.bind(authController));

/**
 * @route   GET /api/auth/google/sync/callback
 * @desc    Google OAuth callback for Gmail sync flow
 * @access  Public
 */
router.get('/google/sync/callback', authController.googleSyncCallback.bind(authController));

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

/**
 * @route   GET /api/auth/email-sync-status
 * @desc    Check if user has synced their email (exists in USER_DETAILS_COLLECTION)
 * @access  Private
 */
router.get('/email-sync-status', authenticateToken, authController.checkEmailSyncStatus.bind(authController));

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
