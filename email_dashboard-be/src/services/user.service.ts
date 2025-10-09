import bcrypt from 'bcryptjs';
import { userModel, CreateUserData, UpdateUserData, User } from '../models/User';
import logger from '../config/logger';

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
      if (updateData.role && !['admin', 'user'].includes(updateData.role)) {
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

      const deleted = await userModel.deleteById(id);
      
      if (deleted) {
        logger.info(`User deleted successfully: ${user.email}`);
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

      // Remove password from returned user object
      const { password: _, ...userWithoutPassword } = user;
      
      logger.info(`User authenticated successfully: ${user.email}`);
      return userWithoutPassword as User;
    } catch (error) {
      logger.error('Error at user service authenticating user:', error);
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
}

// Export singleton instance
export const userService = new UserService();
export default userService;
