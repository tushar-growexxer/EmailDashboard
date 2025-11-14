import { Request, Response, NextFunction } from 'express';
// NOTE: userService import disabled - SAP HANA user authentication not used
// import { userService } from '../services/user.service';
import { generateToken } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import { ldapService } from '../services/ldap.service';
import { ldapSyncService } from '../services/ldapSync.service';
import { googleAuthService } from '../services/googleAuth.service';
import { domainManagementService } from '../services/domainManagement.service';
import { userManagerService } from '../services/userManager.service';
import passport from '../config/passport';

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
  async login(_req: Request, res: Response): Promise<void> {
    // NOTE: Traditional email/password login is disabled - only Google OAuth and LDAP are supported
    // If you need to re-enable SAP HANA user authentication, uncomment the code below
    
    /*
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

      // Check if email domain is allowed
      const isDomainAllowed = await domainManagementService.isEmailDomainAllowed(email);
      if (!isDomainAllowed) {
        res.status(403).json({
          success: false,
          message: 'Your company/domain is not allowed to access the website. Please contact admin.',
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
    */
    
    res.status(400).json({
      success: false,
      message: 'Traditional login is disabled. Please use Google OAuth or LDAP authentication.',
    });
  }

  /**
   * Handle LDAP user login
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when LDAP login is processed
   */
  async ldapLogin(req: Request, res: Response): Promise<void> {
    try {
      logger.info('[LDAP-LOGIN] ========== LDAP Login Process Started ==========');
      const { email: username, password }: LoginRequest = req.body;
      logger.info(`[LDAP-LOGIN] Username: ${username}`);
      logger.info(`[LDAP-LOGIN] Request IP: ${req.ip}`);
      logger.info(`[LDAP-LOGIN] Request headers: ${JSON.stringify(req.headers)}`);

      // Validate request body
      if (!this.validateLoginRequest(username, password)) {
        logger.warn(`[LDAP-LOGIN] Validation failed for username: ${username}`);
        res.status(400).json({
          success: false,
          message: 'Username and password are required',
        });
        return;
      }

      logger.info(`[LDAP-LOGIN] Validation passed, authenticating against LDAP...`);
      // Authenticate user against LDAP
      const ldapUser = await ldapService.authenticateUser(username, password);
      logger.info(`[LDAP-LOGIN] LDAP authentication result: ${ldapUser.authenticated}`);

      if (!ldapUser.authenticated) {
        logger.warn(`[LDAP-LOGIN] Authentication failed for username: ${username}`);
        res.status(401).json({
          success: false,
          message: 'Login failed. Please check your credentials.',
        });
        return;
      }

      logger.info(`[LDAP-LOGIN] LDAP authentication successful for: ${username}`);
      
      // Check if email domain is allowed (for LDAP users with email format)
      if (username.includes('@')) {
        logger.info(`[LDAP-LOGIN] Checking domain allowlist for: ${username}`);
        const isDomainAllowed = await domainManagementService.isEmailDomainAllowed(username);
        logger.info(`[LDAP-LOGIN] Domain allowed: ${isDomainAllowed}`);
        if (!isDomainAllowed) {
          logger.warn(`[LDAP-LOGIN] Domain not allowed for: ${username}`);
          res.status(403).json({
            success: false,
            message: 'Your company/domain is not allowed to access the website. Please contact admin.',
          });
          return;
        }
      }

      // For LDAP users, check MongoDB LDAP users collection for role and active status
      // Extract sAMAccountName from username (before @ if email format)
      const sAMAccountName = username.includes('@') ? username.split('@')[0] : username;

      logger.info(`[LDAP-LOGIN] Extracted sAMAccountName: ${sAMAccountName}`);
      logger.info(`[LDAP-LOGIN] Looking up LDAP user in MongoDB...`);

      // Get all synced LDAP users and find this user
      const ldapUsers = await ldapSyncService.getSyncedUsers();
      logger.info(`[LDAP-LOGIN] Total synced LDAP users in MongoDB: ${ldapUsers.length}`);
      
      const ldapUserData = ldapUsers.find(
        (u) => u.sAMAccountName.toLowerCase() === sAMAccountName.toLowerCase()
      );
      logger.info(`[LDAP-LOGIN] User found in MongoDB: ${!!ldapUserData}`);

      let user;
      let userRole: 'admin' | 'user' = 'user';
      let isActive = false;

      if (ldapUserData) {
        // User found in MongoDB LDAP users collection
        logger.info(`[LDAP-LOGIN] User details from MongoDB:`);
        logger.info(`[LDAP-LOGIN]   - sAMAccountName: ${ldapUserData.sAMAccountName}`);
        logger.info(`[LDAP-LOGIN]   - displayName: ${ldapUserData.displayName}`);
        logger.info(`[LDAP-LOGIN]   - role: ${ldapUserData.role}`);
        logger.info(`[LDAP-LOGIN]   - isActive: ${ldapUserData.isActive}`);
        logger.info(`[LDAP-LOGIN]   - domain: ${ldapUserData.domain}`);
        
        userRole = ldapUserData.role === 'admin' ? 'admin' : 'user';
        isActive = ldapUserData.isActive;

        // Check if user is active
        if (!isActive) {
          logger.warn(`[LDAP-LOGIN] User account is not active: ${ldapUserData.sAMAccountName}`);
          res.status(403).json({
            success: false,
            message: 'Your account is not activated. Please contact an administrator.',
          });
          return;
        }
        
        logger.info(`[LDAP-LOGIN] User is active, proceeding with login...`);

        // Update last login in MongoDB
        try {
          logger.info(`[LDAP-LOGIN] Updating last login timestamp in MongoDB...`);
          await ldapSyncService.updateUserStatus(ldapUserData.sAMAccountName, {
            ...ldapUserData,
            lastLogin: new Date(),
          } as any);
          logger.info(`[LDAP-LOGIN] Last login timestamp updated successfully`);
        } catch (updateError) {
          logger.warn(`[LDAP-LOGIN] Failed to update last login:`, updateError);
        }
      } else {
        // User not found in MongoDB LDAP users collection
        logger.warn(`[LDAP-LOGIN] User not found in MongoDB: ${sAMAccountName}`);
        logger.warn(`[LDAP-LOGIN] User needs to be synced first via LDAP sync endpoint`);
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

      logger.info(`[LDAP-LOGIN] User object created:`);
      logger.info(`[LDAP-LOGIN]   - id: ${user.id}`);
      logger.info(`[LDAP-LOGIN]   - fullName: ${user.fullName}`);
      logger.info(`[LDAP-LOGIN]   - email: ${user.email}`);
      logger.info(`[LDAP-LOGIN]   - role: ${user.role}`);

      // Generate token and set cookie
      logger.info(`[LDAP-LOGIN] Generating JWT token and setting cookie...`);
      this.setAuthCookie(res, user, username);
      logger.info(`[LDAP-LOGIN] Token generated and cookie set successfully`);

      // Send success response
      logger.info(`[LDAP-LOGIN] ========== LDAP Login Successful ==========`);
      this.sendLoginResponse(res, user, 'LDAP login successful', 'LDAP user');
    } catch (error) {
      logger.error('[LDAP-LOGIN] ========== LDAP Login Failed ==========');
      logger.error('[LDAP-LOGIN] Error details:', error);
      if (error instanceof Error) {
        logger.error(`[LDAP-LOGIN] Error message: ${error.message}`);
        logger.error(`[LDAP-LOGIN] Error stack: ${error.stack}`);
      }
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
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
    console.log('========================================');
    console.log('GET PROFILE CALLED - NEW CODE VERSION 2');
    console.log('========================================');
    
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Check user type based on userId format
      const isLdapUser = typeof req.user.userId === 'string' && req.user.userId.startsWith('ldap_');
      const isGoogleUser = typeof req.user.userId === 'string' && req.user.userId.startsWith('google_');

      console.log(`User: ${req.user.email}, ID: ${req.user.userId}`);
      console.log(`isGoogleUser: ${isGoogleUser}, isLdapUser: ${isLdapUser}`);
      
      logger.info(`Get profile for user: ${req.user.email}, userId: ${req.user.userId}`);
      logger.info(`  isGoogleUser: ${isGoogleUser}, isLdapUser: ${isLdapUser}`);

      let user;

      if (isGoogleUser) {
        // For Google users, get data from MongoDB
        logger.info('  Fetching Google user from MongoDB');
        const googleId = (req.user.userId as string).replace('google_', '');
        const googleUserData = await googleAuthService.getUserByGoogleId(googleId);
        logger.info(`  Google user data found: ${!!googleUserData}`);

        if (googleUserData) {
          user = {
            id: req.user.userId,
            fullName: googleUserData.displayName,
            email: googleUserData.email,
            role: googleUserData.role,
            department: 'Google',
            lastLogin: googleUserData.lastLogin,
            isGoogleUser: true,
            hasCompletedOnboarding: googleUserData.hasCompletedOnboarding,
            hasSynced: googleUserData.hasSynced || false,
          };
        }
      } else if (isLdapUser) {
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
        // NOTE: SAP HANA user authentication is disabled - only Google and LDAP users are supported
        // If you need to re-enable SAP HANA users, uncomment the line below:
        // user = await userService.getUserById(req.user.userId as number);
        
        logger.warn(`Unknown user type for userId: ${req.user.userId}, email: ${req.user.email}`);
        user = null;
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

  /**
   * Handle Google OAuth callback for login flow
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>} Promise that resolves when callback is processed
   */
  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Check if this is a sync flow by examining the state parameter
    let stateData: { userId?: string; email?: string; isSync?: boolean } = {};
    try {
      if (req.query.state) {
        stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
      }
    } catch (error) {
      logger.warn('Failed to parse state parameter:', error);
    }

    const isSyncFlow = stateData.isSync === true;

    if (isSyncFlow) {
      // Redirect to sync callback handler
      logger.info('[GOOGLE-CALLBACK] Detected sync flow, delegating to googleSyncCallback');
      return this.googleSyncCallback(req, res, next);
    }

    // Handle regular login flow
    passport.authenticate('google', { session: false }, async (err: any, googleUser: any) => {
      try {
        if (err || !googleUser) {
          logger.error('Google OAuth error:', err);
          res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
          return;
        }

        logger.info(`[GOOGLE-LOGIN] Processing user ${googleUser.email}`);
        logger.info(`[GOOGLE-LOGIN] Granted scopes: ${googleUser.oauthTokens?.scope || 'none'}`);

        // Check if email domain is allowed
        const isDomainAllowed = await domainManagementService.isEmailDomainAllowed(googleUser.email);
        if (!isDomainAllowed) {
          logger.warn(`Google OAuth: Domain not allowed for ${googleUser.email}`);
          res.redirect(`${frontendUrl}/login?error=domain_not_allowed`);
          return;
        }

        // Find or create user in MongoDB
        let user;
        try {
          user = await googleAuthService.findOrCreateUser(googleUser);
          logger.info(`Google user found/created: ${user.email}, active: ${user.isActive}`);
        } catch (dbError) {
          logger.error('MongoDB error during user creation:', dbError);
          // If MongoDB fails, we can still authenticate the user
          // Create a temporary user object without saving to DB
          user = {
            googleId: googleUser.googleId,
            email: googleUser.email,
            displayName: googleUser.displayName,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            profilePicture: googleUser.profilePicture,
            role: 'user' as const,
            isActive: true, // Allow login even if DB fails
            hasCompletedOnboarding: false, // Treat as new user if DB fails
            createdAt: new Date(),
            lastLogin: new Date(),
          };
          logger.warn(`Using temporary user object for ${user.email} due to DB error`);
        }

        // Check if user is active
        if (!user.isActive) {
          logger.warn(`Inactive Google user attempted login: ${user.email}`);
          res.redirect(`${frontendUrl}/login?error=account_not_activated`);
          return;
        }

        // Create user object for token
        const tokenUser = {
          id: `google_${user.googleId}`,
          fullName: user.displayName,
          email: user.email,
          role: user.role,
          department: 'Google',
          lastLogin: new Date(),
          isGoogleUser: true,
          hasCompletedOnboarding: user.hasCompletedOnboarding || false,
        };

        // Generate token and set cookie (token is set in httpOnly cookie)
        this.setAuthCookie(res, tokenUser, user.email);

        // Determine redirect based on onboarding status
        const hasCompletedOnboarding = user.hasCompletedOnboarding || false;
        let redirectUrl: string;

        if (!hasCompletedOnboarding) {
          // Redirect to auth success page which will handle profile fetch and then redirect to onboarding
          redirectUrl = `${frontendUrl}/auth/google/success?redirect=onboarding`;
          logger.info(`[GOOGLE-LOGIN] User needs onboarding - redirecting via success page`);
        } else {
          // Redirect to auth success page which will handle profile fetch and then redirect to dashboard
          redirectUrl = `${frontendUrl}/auth/google/success?redirect=email-analytics`;
          logger.info(`[GOOGLE-LOGIN] User completed onboarding - redirecting via success page`);
        }

        logger.info(`[GOOGLE-LOGIN] ========== Login Successful ==========`);
        logger.info(`[GOOGLE-LOGIN] User: ${user.email}`);
        logger.info(`[GOOGLE-LOGIN] hasCompletedOnboarding: ${hasCompletedOnboarding}`);
        logger.info(`[GOOGLE-LOGIN] Redirect URL: ${redirectUrl}`);

        // Redirect to success page which will fetch profile and then redirect
        res.redirect(redirectUrl);
      } catch (error) {
        logger.error('Google callback error:', error);
        // Log detailed error information
        if (error instanceof Error) {
          logger.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
        }
        res.redirect(`${frontendUrl}/login?error=server_error`);
      }
    })(req, res, next);
  }

  /**
   * Initiate Google OAuth for Gmail sync (with Gmail scopes)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>} Promise that resolves when OAuth is initiated
   */
  async googleSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Check if this is a Google user
    const userId = req.user.userId;
    const isGoogleUser = typeof userId === 'string' && userId.startsWith('google_');

    if (!isGoogleUser) {
      res.status(400).json({
        success: false,
        message: 'Gmail sync is only available for Google users',
      });
      return;
    }

    // Store user info in state for callback with sync flag
    const state = Buffer.from(JSON.stringify({ 
      userId: req.user.userId, 
      email: req.user.email,
      isSync: true, // Flag to identify sync flow
    })).toString('base64');

    // Request Gmail scope + basic profile scopes for email sync
    // We need profile/email scopes so passport can fetch user info
    // The Gmail scope will show the Gmail permissions dialog to the user
    const authOptions: any = {
      scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://mail.google.com/', // Gmail scope for email access
      ],
      session: false,
      state: state,
      accessType: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to show Gmail permissions
      loginHint: req.user.email, // Pre-select the current user's email in account chooser
      // Use the same callback URL as login (must be registered in Google Cloud Console)
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    };

    logger.info(`[GOOGLE-SYNC] Initiating Gmail sync for user: ${req.user.email}`);
    logger.info(`[GOOGLE-SYNC] Requesting scopes: openid, profile, email, https://mail.google.com/`);
    logger.info(`[GOOGLE-SYNC] Callback URL: ${authOptions.callbackURL}`);
    logger.info(`[GOOGLE-SYNC] State includes isSync flag for flow detection`);
    logger.info(`[GOOGLE-SYNC] prompt: 'consent' - This will show the Gmail permissions consent screen`);

    passport.authenticate('google', authOptions)(req, res, next);
  }

  /**
   * Check if user has synced their email
   * Checks GOOGLE_USERS_COLLECTION.hasSynced field
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when check is complete
   */
  async checkEmailSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userId = req.user.userId;
      
      // Check if this is a Google user
      const isGoogleUser = typeof userId === 'string' && userId.startsWith('google_');
      
      if (!isGoogleUser) {
        res.status(200).json({
          success: true,
          isSynced: false,
          message: 'Email sync is only available for Google users',
        });
        return;
      }

      // Extract Google ID
      const googleId = userId.replace('google_', '');
      
      // Check hasSynced from GOOGLE_USERS_COLLECTION
      const googleUser = await googleAuthService.getUserByGoogleId(googleId);
      
      const isSynced = !!(googleUser && googleUser.hasSynced);
      
      res.status(200).json({
        success: true,
        isSynced,
        hasCompletedOnboarding: googleUser?.hasCompletedOnboarding || false,
        message: isSynced 
          ? 'Email is already synced' 
          : 'Email has not been synced yet',
      });
    } catch (error) {
      logger.error('Error checking email sync status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check email sync status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle Google OAuth callback for Gmail sync
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>} Promise that resolves when callback is processed
   */
  async googleSyncCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Extract state to get user info
    let stateData: { userId?: string; email?: string } = {};
    try {
      if (req.query.state) {
        stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
      }
    } catch (error) {
      logger.warn('Failed to parse state parameter:', error);
    }

    passport.authenticate('google', { session: false }, async (err: any, googleUser: any) => {
      try {
        if (err || !googleUser) {
          logger.error('[GOOGLE-SYNC-CALLBACK] Google OAuth sync error:', err);
          logger.error('[GOOGLE-SYNC-CALLBACK] Error details:', { err, googleUser });
          res.redirect(`${frontendUrl}/onboarding?error=google_sync_failed`);
          return;
        }

        logger.info(`[GOOGLE-SYNC-CALLBACK] ========== Processing Gmail Sync ==========`);
        logger.info(`[GOOGLE-SYNC-CALLBACK] Google User object:`, {
          googleId: googleUser.googleId,
          email: googleUser.email,
          displayName: googleUser.displayName,
          hasOAuthTokens: !!googleUser.oauthTokens,
          scope: googleUser.oauthTokens?.scope || 'none',
        });

        // Extract Google ID from state (required since profile might not have email when only Gmail scope is requested)
        let googleId: string;
        let userEmail: string;
        
        if (stateData.userId && typeof stateData.userId === 'string' && stateData.userId.startsWith('google_')) {
          googleId = stateData.userId.replace('google_', '');
          logger.info(`[GOOGLE-SYNC-CALLBACK] Using Google ID from state: ${googleId}`);
        } else if (googleUser.googleId) {
          googleId = googleUser.googleId;
          logger.info(`[GOOGLE-SYNC-CALLBACK] Using Google ID from OAuth response: ${googleId}`);
        } else {
          logger.error('[GOOGLE-SYNC-CALLBACK] No Google ID available in state or OAuth response');
          res.redirect(`${frontendUrl}/onboarding?error=google_sync_failed`);
          return;
        }

        // Get email from state (since Gmail-only scope doesn't return profile/email)
        if (stateData.email) {
          userEmail = stateData.email;
          logger.info(`[GOOGLE-SYNC-CALLBACK] Using email from state: ${userEmail}`);
        } else if (googleUser.email) {
          userEmail = googleUser.email;
          logger.info(`[GOOGLE-SYNC-CALLBACK] Using email from OAuth response: ${userEmail}`);
        } else {
          // Try to get user from MongoDB using googleId
          const existingUser = await googleAuthService.getUserByGoogleId(googleId);
          if (existingUser && existingUser.email) {
            userEmail = existingUser.email;
            logger.info(`[GOOGLE-SYNC-CALLBACK] Using email from MongoDB: ${userEmail}`);
          } else {
            logger.error('[GOOGLE-SYNC-CALLBACK] No email available in state, OAuth response, or MongoDB');
            res.redirect(`${frontendUrl}/onboarding?error=google_sync_failed`);
            return;
          }
        }

        // Verify the email matches if we have both
        if (stateData.email && googleUser.email && stateData.email !== googleUser.email) {
          logger.warn(`[GOOGLE-SYNC-CALLBACK] Email mismatch: expected ${stateData.email}, got ${googleUser.email}`);
          // Use state email as it's more reliable for sync flow
          logger.info(`[GOOGLE-SYNC-CALLBACK] Using state email: ${stateData.email}`);
        }

        // Get existing user from MongoDB to preserve user data
        const existingUser = await googleAuthService.getUserByGoogleId(googleId);
        if (!existingUser) {
          logger.error(`[GOOGLE-SYNC-CALLBACK] User not found in MongoDB with googleId: ${googleId}`);
          res.redirect(`${frontendUrl}/onboarding?error=user_not_found`);
          return;
        }

        logger.info(`[GOOGLE-SYNC-CALLBACK] Found existing user: ${existingUser.email}`);

        // Extract actual scope from Google's OAuth response
        const grantedScope = googleUser.oauthTokens?.scope || 'https://mail.google.com/';
        logger.info(`[GOOGLE-SYNC-CALLBACK] Granted scope: ${grantedScope}`);

        // Update Google user with new OAuth tokens (with Gmail scopes for sync)
        // Use existing user data and only update OAuth tokens
        const updatedUser = await googleAuthService.findOrCreateUser({
          googleId: googleId,
          email: userEmail,
          displayName: existingUser.displayName || googleUser.displayName || '',
          firstName: existingUser.firstName || googleUser.firstName || '',
          lastName: existingUser.lastName || googleUser.lastName || '',
          profilePicture: existingUser.profilePicture || googleUser.profilePicture,
          oauthTokens: {
            access_token: googleUser.oauthTokens.access_token,
            refresh_token: googleUser.oauthTokens.refresh_token,
            token_type: googleUser.oauthTokens.token_type || 'Bearer',
            scope: grantedScope, // Use actual granted scope from Google
            expires_in: googleUser.oauthTokens.expires_in,
          },
        });

        logger.info(`[GOOGLE-SYNC-CALLBACK] Updated user with Gmail OAuth tokens: ${updatedUser.email}`);

        // Mark user as synced (both onboarding and sync completed)
        logger.info(`[GOOGLE-SYNC-CALLBACK] Marking user as synced: ${googleId}`);
        await googleAuthService.markAsSynced(googleId);
        logger.info(`[GOOGLE-SYNC-CALLBACK] User marked as synced successfully`);

        // Sync user details to UserManager (EMAIL_DATABASE)
        logger.info(`[GOOGLE-SYNC-CALLBACK] Syncing user to UserManager (EMAIL_DATABASE)...`);
        try {
          const fullName = updatedUser.displayName || `${updatedUser.firstName} ${updatedUser.lastName}`.trim();

          // Calculate token expiry timestamp
          const now = Math.floor(Date.now() / 1000); // Current time in seconds
          const expiresIn = googleUser.oauthTokens?.expires_in || 3599;
          const expiresAt = now + expiresIn;

          // Convert GoogleOAuthTokens to OAuthTokens format matching Python structure
          // NOTE: Do NOT store scope in UserDetails - it's not needed and causes issues
          const oauthTokens = {
            access_token: googleUser.oauthTokens.access_token,
            refresh_token: googleUser.oauthTokens.refresh_token || '',
            token_type: googleUser.oauthTokens.token_type || 'Bearer',
            expires_in: expiresIn,
            // scope: removed - not needed in UserDetails
            id_token: googleUser.id_token || '', // JWT token from Google (now properly captured from OAuth response)
            username: updatedUser.email,
            full_name: fullName,
            expires_at: expiresAt,
            created_at: now,
          };

          logger.info(`[GOOGLE-SYNC-CALLBACK] Calling userManagerService.addUser for: ${updatedUser.email}`);
          logger.info(`[GOOGLE-SYNC-CALLBACK] OAuth tokens present: ${!!oauthTokens.access_token}`);
          logger.info(`[GOOGLE-SYNC-CALLBACK] Refresh token present: ${!!oauthTokens.refresh_token}`);

          const sequentialId = await userManagerService.addUser(
            updatedUser.email,
            oauthTokens,
            fullName
          );

          logger.info(`[GOOGLE-SYNC-CALLBACK] ✓ User synced to UserManager (EMAIL_DATABASE): ${updatedUser.email} (Sequential ID: ${sequentialId})`);
        } catch (syncError) {
          logger.error(`[GOOGLE-SYNC-CALLBACK] ❌ Failed to sync user to UserManager:`, syncError);
          if (syncError instanceof Error) {
            logger.error(`[GOOGLE-SYNC-CALLBACK] Error message: ${syncError.message}`);
            logger.error(`[GOOGLE-SYNC-CALLBACK] Error stack: ${syncError.stack}`);
          }
          // Continue even if sync fails - user is still synced in Google users collection
          // But log it as a warning so we know about it
          logger.warn(`[GOOGLE-SYNC-CALLBACK] ⚠ User sync to UserManager failed, but continuing with redirect`);
        }

        // Redirect to success page after successful sync which will fetch profile and redirect to dashboard
        logger.info(`[GOOGLE-SYNC-CALLBACK] ========== Gmail Sync Completed Successfully ==========`);
        logger.info(`[GOOGLE-SYNC-CALLBACK] User: ${updatedUser.email}`);
        logger.info(`[GOOGLE-SYNC-CALLBACK] Redirecting via success page`);
        
        // Redirect to success page which will fetch profile and then redirect to dashboard
        const redirectUrl = `${frontendUrl}/auth/google/success?redirect=email-analytics`;
        logger.info(`[GOOGLE-SYNC-CALLBACK] Redirect URL: ${redirectUrl}`);
        res.redirect(redirectUrl);
      } catch (error) {
        logger.error('Google sync callback error:', error);
        if (error instanceof Error) {
          logger.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
        }
        res.redirect(`${frontendUrl}/onboarding?error=server_error`);
      }
    })(req, res, next);
  }
}

// Export singleton instance
export const authController = new AuthController();
export default authController;
