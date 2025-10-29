import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { generateToken } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import { ldapService } from '../services/ldap.service';
import { ldapSyncService } from '../services/ldapSync.service';

/**
 * Interface for login request body
 */
interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Authentication controller class
 */
export class AuthController {
  /**
   * Handle user login
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when login is processed
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Validate request body
      if (!this.validateLoginRequest(email, password)) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      // Authenticate user
      const user = await userService.authenticateUser(email, password);

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Generate token and set cookie
      this.setAuthCookie(res, user, user.email);

      // Send success response
      this.sendLoginResponse(res, user, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Handle LDAP user login
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when LDAP login is processed
   */
  async ldapLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email: username, password }: LoginRequest = req.body;

      // Validate request body
      if (!this.validateLoginRequest(username, password)) {
        res.status(400).json({
          success: false,
          message: 'Username and password are required',
        });
        return;
      }

      // Authenticate user against LDAP
      const ldapUser = await ldapService.authenticateUser(username, password);

      if (!ldapUser.authenticated) {
        res.status(401).json({
          success: false,
          message: 'LDAP authentication failed. Please check your credentials.',
        });
        return;
      }

      // For LDAP users, check MongoDB LDAP users collection for role and active status
      // Extract sAMAccountName from username (before @ if email format)
      const sAMAccountName = username.includes('@') ? username.split('@')[0] : username;

      logger.info(`Looking up LDAP user in MongoDB: ${sAMAccountName}`);

      // Get all synced LDAP users and find this user
      const ldapUsers = await ldapSyncService.getSyncedUsers();
      const ldapUserData = ldapUsers.find(
        (u) => u.sAMAccountName.toLowerCase() === sAMAccountName.toLowerCase()
      );

      let user;
      let userRole: 'admin' | 'user' = 'user';
      let isActive = false;

      if (ldapUserData) {
        // User found in MongoDB LDAP users collection
        logger.info(
          `Found LDAP user in MongoDB: ${ldapUserData.sAMAccountName}, role: ${ldapUserData.role}, active: ${ldapUserData.isActive}`
        );
        userRole = ldapUserData.role === 'admin' ? 'admin' : 'user';
        isActive = ldapUserData.isActive;

        // Check if user is active
        if (!isActive) {
          res.status(403).json({
            success: false,
            message: 'Your account is not activated. Please contact an administrator.',
          });
          return;
        }

        // Update last login in MongoDB
        try {
          await ldapSyncService.updateUserStatus(ldapUserData.sAMAccountName, {
            ...ldapUserData,
            lastLogin: new Date(),
          } as any);
        } catch (updateError) {
          logger.warn('Failed to update last login:', updateError);
        }
      } else {
        // User not found in MongoDB LDAP users collection
        logger.warn(
          `LDAP user not found in MongoDB: ${sAMAccountName}. User needs to be synced first.`
        );
        res.status(403).json({
          success: false,
          message:
            'Your account has not been provisioned yet. Please contact an administrator to sync LDAP users.',
        });
        return;
      }

      // For LDAP users, we don't store them in SAP HANA
      // Instead, we create a virtual user object from MongoDB data
      user = {
        id: `ldap_${sAMAccountName}`, // Use string ID to identify LDAP users
        fullName: ldapUser.displayName || ldapUserData.displayName || username,
        email: ldapUser.email || ldapUser.upn || username,
        role: userRole,
        department: 'LDAP',
        lastLogin: new Date(),
        isLdapUser: true, // Flag to identify LDAP users
      };

      logger.info(`LDAP user authenticated: ${user.email} with role: ${userRole}`);

      // Generate token and set cookie
      this.setAuthCookie(res, user, username);

      // Send success response
      this.sendLoginResponse(res, user, 'LDAP login successful', 'LDAP user');
    } catch (error) {
      logger.error('LDAP login error:', error);
      res.status(500).json({
        success: false,
        message: 'LDAP authentication failed. Please try again.',
      });
    }
  }
  logout(_req: Request, res: Response): void {
    // Clear the auth cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      path: '/',
    });

    logger.info('User logged out');

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  }

  /**
   * Validate login request body
   * @private
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {boolean} True if valid, false otherwise
   */
  private validateLoginRequest(email: string, password: string): boolean {
    // Check required fields
    if (!email || !password) {
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    return true;
  }

  /**
   * Generate token and set authentication cookie
   * @private
   * @param {Response} res - Express response object
   * @param {any} user - User object
   * @param {string} userIdentifier - Username or email for logging
   */
  private setAuthCookie(res: Response, user: any, userIdentifier: string): string {
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set httpOnly cookie with token
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Must be false for HTTP development
      sameSite: 'lax' as const,
      maxAge: 30 * 60 * 1000, // 30 minutes
      path: '/',
    };

    res.cookie('auth_token', token, cookieOptions);

    logger.info(`Cookie set for user: ${userIdentifier}`);
    logger.info(`Cookie options:`, cookieOptions);
    logger.info(`Request origin: ${res.req?.get('origin')}`);
    logger.info(`Request host: ${res.req?.get('host')}`);

    return token;
  }

  /**
   * Send successful login response
   * @private
   * @param {Response} res - Express response object
   * @param {any} user - User object
   * @param {string} message - Success message
   * @param {string} loginType - Type of login (for logging)
   */
  private sendLoginResponse(
    res: Response,
    user: any,
    message: string,
    loginType: string = 'User'
  ): void {
    logger.info(`${loginType} logged in successfully: ${user.email}`);

    // Send user data (without token for security)
    res.status(200).json({
      success: true,
      message,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin,
      },
    });
  }

  /**
   * Get current user profile
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when profile is retrieved
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Check if this is an LDAP user
      const isLdapUser = typeof req.user.userId === 'string' && req.user.userId.startsWith('ldap_');

      let user;

      if (isLdapUser) {
        // For LDAP users, get data from MongoDB
        const sAMAccountName = (req.user.userId as string).replace('ldap_', '');
        const ldapUsers = await ldapSyncService.getSyncedUsers();
        const ldapUserData = ldapUsers.find(
          (u) => u.sAMAccountName.toLowerCase() === sAMAccountName.toLowerCase()
        );

        if (ldapUserData) {
          user = {
            id: req.user.userId,
            fullName: ldapUserData.displayName,
            email: ldapUserData.userPrincipalName || ldapUserData.mail || req.user.email,
            role: ldapUserData.role === 'admin' ? 'admin' : 'user',
            department: 'LDAP',
            lastLogin: ldapUserData.lastLogin,
          };
        }
      } else {
        // For regular users, get from SAP HANA
        user = await userService.getUserById(req.user.userId as number);
      }

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Validate token endpoint
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {void}
   */
  validateToken(req: Request, res: Response): void {
    // If we reach this point, the token is valid (authenticateToken middleware passed)
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: req.user,
    });
  }
}

// Export singleton instance
export const authController = new AuthController();
export default authController;
