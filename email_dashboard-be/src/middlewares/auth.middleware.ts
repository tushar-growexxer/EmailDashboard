import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/User';
import logger from '../config/logger';

/**
 * Interface for JWT payload
 */
export interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
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
    // Get token from cookie instead of Authorization header
    const token = req.cookies?.auth_token;

    if (!token) {
      logger.warn('Authentication failed: No token found in cookies', {
        path: req.path,
        cookies: Object.keys(req.cookies || {}),
        hasCookieParser: !!req.cookies,
      });
      res.status(401).json({
        success: false,
        message: 'Please re-login/refresh the page to continue.',
      });
      return;
    }

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
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Verify that the user still exists in the database
    const user = await userModel.findById(decoded.userId);
    if (!user) {
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

    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
      return;
    }

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
 * Middleware to check if user is admin or regular user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const requireAuth = authorizeRoles(['admin', 'user']);

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
