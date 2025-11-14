import bcrypt from 'bcryptjs';
import { userModel, CreateUserData, UpdateUserData, User } from '../models/User';
import { db } from '../config/database';
import logger from '../config/logger';
import { userManagerService } from './userManager.service';

/**
 * User service class for business logic operations
 */
export class UserService {
  private readonly saltRounds = 12;

  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password to compare against
   * @returns {Promise<boolean>} True if passwords match, false otherwise
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Error at user service comparing passwords:', error);
      throw new Error('Failed to compare passwords');
    }
  }

  /**
   * Create a new user
   * @param {CreateUserData} userData - User data to create
   * @returns {Promise<User>} Created user object (without password)
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Validate email format - only allow specific domains
      const emailRegex = /^[^\s@]+@(matangiindustries\.com|minalspecialities\.com)$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format. Only @matangiindustries.com and @minalspecialities.com domains are allowed');
      }

      // Check if email already exists
      const existingUser = await userModel.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Validate password strength
      if (userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Validate role
      if (!['admin', 'user'].includes(userData.role)) {
        throw new Error('Invalid role. Must be either "admin" or "user"');
      }

      // Hash the password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user with hashed password
      const userDataWithHashedPassword: CreateUserData = {
        ...userData,
        password: hashedPassword,
      };

      const user = await userModel.create(userDataWithHashedPassword);

      // Remove password from returned user object
      const { password, ...userWithoutPassword } = user;
      
      logger.info(`User created successfully: ${user.email}`);
      return userWithoutPassword as User;
    } catch (error) {
      logger.error('Error at user service creating user:', error);
      throw error;
    }
  }

  /**
   * Get all users (without passwords)
   * @returns {Promise<User[]>} Array of user objects
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await userModel.findAll();
      
      // Remove passwords from all users
      return users.map(({ password, ...user }) => user as User);
    } catch (error) {
      logger.error('Error at user service getting all users:', error);
      throw error;
    }
  }

  /**
   * Get a user by ID (without password)
   * @param {number} id - User ID
   * @returns {Promise<User | null>} User object or null if not found
   */
  async getUserById(id: number): Promise<User | null> {
    try {
      const user = await userModel.findById(id);
      
      if (!user) {
        return null;
      }

      // Remove password from returned user object
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      logger.error('Error at user service getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Update a user by ID
   * @param {number} id - User ID to update
   * @param {UpdateUserData} updateData - Data to update
   * @returns {Promise<User>} Updated user object (without password)
   */
  async updateUser(id: number, updateData: UpdateUserData): Promise<User> {
    try {
      // Validate role if provided
      if (updateData.role && !['admin', 'user','super admin'].includes(updateData.role)) {
        throw new Error('Invalid role. Must be either "admin" or "user"');
      }

      const user = await userModel.updateById(id, updateData);

      // Remove password from returned user object
      const { password, ...userWithoutPassword } = user;
      
      logger.info(`User updated successfully: ${user.email}`);
      return userWithoutPassword as User;
    } catch (error) {
      logger.error('Error at user service updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user by ID
   * @param {number} id - User ID to delete
   * @returns {Promise<boolean>} True if user was deleted, false otherwise
   */
  async deleteUser(id: number): Promise<boolean> {
    try {
      // Check if user exists before attempting to delete
      const user = await userModel.findById(id);
      if (!user) {
        return false;
      }

      // CRITICAL: Terminate session FIRST before deleting user
      // This ensures the thread is stopped before user deletion
      logger.info(`[USER-SERVICE] Terminating session for ${user.email} (must succeed before deletion)...`);
      const { sessionTerminationService } = await import('./sessionTermination.service');
      const sessionTerminated = await sessionTerminationService.terminateSession(user.email);
      
      if (!sessionTerminated) {
        logger.error(`[USER-SERVICE] ❌ Session termination failed for ${user.email} - aborting user deletion`);
        throw new Error(`Failed to terminate session for ${user.email}. User deletion aborted.`);
      }
      
      logger.info(`[USER-SERVICE] ✓ Session terminated successfully for ${user.email}`);
      logger.info(`[USER-SERVICE] Proceeding with user deletion...`);

      // Only delete from database if session termination succeeded
      const deleted = await userModel.deleteById(id);
      
      if (deleted) {
        logger.info(`User deleted successfully: ${user.email}`);
        
        // Also delete from UserManager if user exists there
        try {
          await userManagerService.deleteUser(user.email);
          logger.info(`User also deleted from UserManager: ${user.email}`);
        } catch (userManagerError) {
          // Log error but don't fail the deletion if UserManager deletion fails
          logger.warn(`Failed to delete user from UserManager: ${userManagerError}`);
        }
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error at user service deleting user:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<User | null>} User object if authentication successful, null otherwise
   */
  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await userModel.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      const isPasswordValid = await this.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }

      // Update last login timestamp
      await userModel.updateLastLogin(user.id);

      // Get updated user data with new lastLogin timestamp
      const updatedUser = await userModel.findByEmail(email);

      if (!updatedUser) {
        return null;
      }

      // Remove password from returned user object
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      logger.info(`User authenticated successfully: ${updatedUser.email}`);
      return userWithoutPassword as User;
    } catch (error) {
      logger.error('Error at user service authenticating user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if password changed successfully, false otherwise
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get user with password
      const user = await userModel.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await this.comparePassword(currentPassword, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Get database configuration
      const config = db.getConfig();
      const tableName = `"${config.schema}"."@${config.usersTable}"`;

      // Update password in database
      const sql = `UPDATE ${tableName} SET "U_Password" = ?, "U_UpdatedAt" = CURRENT_TIMESTAMP WHERE "Code" = ?`;
      
      await db.preparedStatement(sql, [hashedPassword, userId]);
      
      logger.info(`Password changed successfully for user ID: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error at user service changing password:', error);
      throw error;
    }
  }

  /**
   * Get user by email (for authentication purposes)
   * @param {string} email - User email
   * @returns {Promise<User | null>} User object with password or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await userModel.findByEmail(email);
    } catch (error) {
      logger.error('Error at user service getting user by email:', error);
      throw error;
    }
  }

  /**
   * Reset user password (Admin only - does not require current password)
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if password reset successfully
   */
  async resetUserPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      // Get user
      const user = await userModel.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Get database configuration
      const config = db.getConfig();
      const tableName = `"${config.schema}"."@${config.usersTable}"`;

      // Update password in database
      const sql = `UPDATE ${tableName} SET "U_Password" = ?, "U_UpdatedAt" = CURRENT_TIMESTAMP WHERE "Code" = ?`;
      
      await db.preparedStatement(sql, [hashedPassword, userId]);
      
      logger.info(`Password reset successfully for user ID: ${userId} by admin`);
      return true;
    } catch (error) {
      logger.error('Error at user service resetting password:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
