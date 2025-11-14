import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/User';
import { googleAuthService } from '../services/googleAuth.service';
import logger from '../config/logger';

/**
 * Interface for JWT payload
 */
export interface JWTPayload {
  userId: number | string; // Allow string for LDAP users
  email: string;
  role: 'admin' | 'user' | 'super admin' | 'manager';
  iat?: number;
  exp?: number;
}

/**
 * Extend Express Request interface to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware to verify JWT tokens
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>} Promise that resolves when authentication is complete
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info(`[AUTH-MIDDLEWARE] ========== Authenticating Request ==========`);
    logger.info(`[AUTH-MIDDLEWARE] Path: ${req.path}`);
    logger.info(`[AUTH-MIDDLEWARE] Method: ${req.method}`);
    
    // Get token from cookie instead of Authorization header
    const token = req.cookies?.auth_token;

    if (!token) {
      logger.warn('[AUTH-MIDDLEWARE] ❌ Authentication failed: No token found in cookies');
      logger.warn('[AUTH-MIDDLEWARE] Available cookies:', Object.keys(req.cookies || {}));
      logger.warn('[AUTH-MIDDLEWARE] Cookie header:', req.headers.cookie);
      logger.warn('[AUTH-MIDDLEWARE] Origin:', req.headers.origin);
      logger.warn('[AUTH-MIDDLEWARE] Referer:', req.headers.referer);
      res.status(401).json({
        success: false,
        message: 'Please re-login/refresh the page to continue.',
      });
      return;
    }
    
    logger.info(`[AUTH-MIDDLEWARE] Token found in cookies`);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not configured');
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
      return;
    }

    // Verify the token
    logger.info(`[AUTH-MIDDLEWARE] Verifying JWT token...`);
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    logger.info(`[AUTH-MIDDLEWARE] ✓ Token verified successfully`);
    logger.info(`[AUTH-MIDDLEWARE] User ID: ${decoded.userId}`);
    logger.info(`[AUTH-MIDDLEWARE] Email: ${decoded.email}`);
    logger.info(`[AUTH-MIDDLEWARE] Role: ${decoded.role}`);

    // Check if this is an LDAP user (string ID starting with "ldap_")
    const isLdapUser = typeof decoded.userId === 'string' && decoded.userId.startsWith('ldap_');
    
    // Check if this is a Google user (string ID starting with "google_")
    const isGoogleUser = typeof decoded.userId === 'string' && decoded.userId.startsWith('google_');

    logger.info(`[AUTH-MIDDLEWARE] User type: ${isLdapUser ? 'LDAP' : isGoogleUser ? 'Google' : 'Regular'}`);

    if (isLdapUser) {
      logger.info(`[AUTH-MIDDLEWARE] ✓ LDAP user authenticated - ${decoded.email}`);
      // For LDAP users, we don't check SAP HANA database
      // Just use the data from the token
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      logger.info(`[AUTH-MIDDLEWARE] ========== Authentication Complete ==========`);
      next();
      return;
    }

    if (isGoogleUser) {
      logger.info(`[AUTH-MIDDLEWARE] Processing Google user - ${decoded.email}`);
      
      // Extract Google ID from userId (format: "google_123456789")
      const googleId = (decoded.userId as string).replace('google_', '');
      
      // Fetch Google user from MongoDB google-users collection
      let googleUser;
      try {
        googleUser = await googleAuthService.getUserByGoogleId(googleId);
        
        if (!googleUser) {
          logger.warn(`Google user not found in MongoDB - GoogleID: ${googleId}, Email: ${decoded.email}`);
          res.status(401).json({
            success: false,
            message: 'User not found in database',
          });
          return;
        }
        
        // Check if user is active
        if (!googleUser.isActive) {
          logger.warn(`Inactive Google user attempted authentication - ${decoded.email}`);
          res.status(403).json({
            success: false,
            message: 'Your account is not activated. Please contact an administrator.',
          });
          return;
        }
        
        logger.info(`[AUTH-MIDDLEWARE] ✓ Google user authenticated from MongoDB`);
        logger.info(`[AUTH-MIDDLEWARE] Email: ${googleUser.email}`);
        logger.info(`[AUTH-MIDDLEWARE] Role: ${googleUser.role}`);
        logger.info(`[AUTH-MIDDLEWARE] Active: ${googleUser.isActive}`);
      } catch (error) {
        logger.error('[AUTH-MIDDLEWARE] Error fetching Google user from MongoDB:', error);
        // Fallback to token data if MongoDB fetch fails
        logger.warn('[AUTH-MIDDLEWARE] Falling back to token data for Google user authentication');
        googleUser = null;
      }
      
      // Also check regular users database (SAP HANA) by email (optional check)
      // This is just for logging/info, errors are ignored
      try {
        const regularUser = await userModel.findByEmail(decoded.email);
        if (regularUser) {
          logger.info(`Google user also found in regular users database - ${decoded.email}`);
        }
      } catch (error: any) {
        // Silently ignore database errors for Google users
        // This is expected if the table doesn't exist or user isn't in regular DB
        if (error?.code !== 259) { // Only log non-table-not-found errors
          logger.debug('Optional check: Google user not in regular users database (expected)');
        }
      }
      
      // Use Google user data from MongoDB if available, otherwise fallback to token data
      // Prefer role from MongoDB if available, otherwise use token role
      const userRole = googleUser?.role || decoded.role;
      
      req.user = {
        userId: decoded.userId,
        email: googleUser?.email || decoded.email,
        role: userRole,
      };
      
      logger.info(`[AUTH-MIDDLEWARE] ✓ Google user authenticated successfully`);
      logger.info(`[AUTH-MIDDLEWARE] ========== Authentication Complete ==========`);
      next();
      return;
    }

    // For regular users, verify that the user still exists in the database
    const user = await userModel.findById(decoded.userId as number);
    if (!user) {
      logger.warn(`Authentication: User not found in database - UserID: ${decoded.userId}, Email: ${decoded.email}`);
      res.status(401).json({
        success: false,
        message: 'User not found or token is invalid',
      });
      return;
    }

    // Add user information to request object
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Refresh token on every request to extend session (activity-based session)
    // Only refresh if token is more than 30 minutes old to avoid excessive token generation
    const tokenAge = decoded.iat ? Date.now() / 1000 - decoded.iat : 0;
    const REFRESH_THRESHOLD = 30 * 60; // 30 minutes in seconds

    if (tokenAge > REFRESH_THRESHOLD) {
      const newToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
        maxAge: 30 * 60 * 1000, // 30 minutes in milliseconds
        path: '/',
      };

      res.cookie('auth_token', newToken, cookieOptions);
      logger.info(`Token refreshed for user: ${user.email}, age was ${Math.floor(tokenAge / 60)} minutes`);
    }

    logger.info(`[AUTH-MIDDLEWARE] ✓ Regular user authenticated successfully`);
    logger.info(`[AUTH-MIDDLEWARE] ========== Authentication Complete ==========`);
    next();
  } catch (error) {
    logger.error('[AUTH-MIDDLEWARE] ========== Authentication Error ==========');
    logger.error('[AUTH-MIDDLEWARE] Error details:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      logger.error('[AUTH-MIDDLEWARE] JWT Error: Invalid token');
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.error('[AUTH-MIDDLEWARE] JWT Error: Token expired');
      res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
      return;
    }

    logger.error('[AUTH-MIDDLEWARE] Unknown authentication error');
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Authorization middleware to check user roles
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Middleware function
 */
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.userId} with role ${req.user.role}`);
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const requireAdmin = authorizeRoles(['admin']);

/**
 * Middleware to check if user is admin, manager, or regular user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const requireAuth = authorizeRoles(['admin', 'user', 'super admin', 'manager']);

/**
 * Middleware to check if user is super admin
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const requireSuperAdmin = authorizeRoles(['super admin']);

/**
 * Utility function to generate JWT token
 * @param {JWTPayload} payload - JWT payload data
 * @returns {string} Generated JWT token
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30m'; // Changed from 8h to 30m

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  // @ts-ignore - JWT types issue with expiresIn
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
};

/**
 * Utility function to verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {JWTPayload} Decoded JWT payload
 */
export const verifyToken = (token: string): JWTPayload => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.verify(token, jwtSecret) as JWTPayload;
};
