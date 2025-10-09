import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import logger from '../config/logger';

/**
 * Interface for create user request body
 */
interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

/**
 * Interface for update user request body
 */
interface UpdateUserRequest {
  fullName?: string;
  role?: 'admin' | 'user';
}

/**
 * User controller class
 */
export class UserController {
  /**
   * Create a new user (Admin only)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when user is created
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, password, role }: CreateUserRequest = req.body;

      // Validate request body
      if (!fullName || !email || !password || !role) {
        res.status(400).json({
          success: false,
          message: 'All fields (fullName, email, password, role) are required',
        });
        return;
      }

      // Validate role
      if (!['admin', 'user'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role. Must be either "admin" or "user"',
        });
        return;
      }

      // Validate password strength
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
        return;
      }

      const user = await userService.createUser({
        fullName,
        email,
        password,
        role,
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Create user error:', error);

      if (error instanceof Error) {
        if (error.message === 'Email already exists') {
          res.status(400).json({
            success: false,
            message: 'Email already exists',
          });
          return;
        }

        if (error.message.includes('Invalid') || error.message.includes('must be')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get all users (Admin only)
   * @param {Request} _req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when users are retrieved
   */
  async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();

      res.status(200).json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get a single user by ID (Admin only)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when user is retrieved
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      const user = await userService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update a user by ID (Admin only)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when user is updated
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { fullName, role }: UpdateUserRequest = req.body;

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      // Validate that at least one field is provided
      if (!fullName && !role) {
        res.status(400).json({
          success: false,
          message: 'At least one field (fullName or role) must be provided',
        });
        return;
      }

      // Validate role if provided
      if (role && !['admin', 'user'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role. Must be either "admin" or "user"',
        });
        return;
      }

      const user = await userService.updateUser(userId, { fullName, role });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Update user error:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
          return;
        }

        if (error.message.includes('Invalid') || error.message.includes('must be')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Delete a user by ID (Admin only)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when user is deleted
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      // Prevent admin from deleting themselves
      if (req.user && req.user.userId === userId) {
        res.status(400).json({
          success: false,
          message: 'You cannot delete your own account',
        });
        return;
      }

      const deleted = await userService.deleteUser(userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

// Export singleton instance
export const userController = new UserController();
export default userController;
