import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { generateToken } from '../middlewares/auth.middleware';
import logger from '../config/logger';

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
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
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

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        // department: user.department,
      });

      // Set httpOnly cookie with token
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 30 * 60 * 1000, // 30 minutes
        path: '/',
      };

      res.cookie('auth_token', token, cookieOptions);

      logger.info(`User logged in successfully: ${user.email}`);

      // Send user data (without token for security)
      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          department: user.department,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Handle user logout (client-side token removal)
   * @param {Request} _req - Express request object
   * @param {Response} res - Express response object
   * @returns {void}
   */
  logout(_req: Request, res: Response): void {
    // Clear the auth cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    });

    logger.info('User logged out');

    res.status(200).json({
      success: true,
      message: 'Logout successful',
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

      const user = await userService.getUserById(req.user.userId);

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
