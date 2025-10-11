import { db } from '../config/database';
import logger from '../config/logger';

/**
 * User interface representing the structure of a user record
 */
export interface User {
  id: number;
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt?: Date;
  department?: string;
  lastLogin?: Date;
}

/**
 * User creation interface (without id and timestamps)
 */
export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  department: string;
}

/**
 * User update interface (partial fields)
 */
export interface UpdateUserData {
  fullName?: string;
  role?: 'admin' | 'user';
  department?: string;
}

/**
 * User model class for database operations
 */
export class UserModel {
  private readonly tableName: string;
  private readonly schemaName: string;

  constructor() {
    const config = db.getConfig();
    this.schemaName = config.schema;
    this.tableName = `"${this.schemaName}"."@${config.usersTable}"`;
  }

  /**
   * Get the next available user ID
   * @returns {Promise<number>} Next available ID
   */
  private async getNextId(): Promise<number> {
    try {
      // Get the current max ID and add 1
      const maxIdSql = `SELECT COALESCE(MAX(CAST("Code" AS INTEGER)), 0) as "maxId" FROM ${this.tableName}`;
      const maxIdResult = await db.query(maxIdSql);

      const nextId = (maxIdResult[0].maxId as number) + 1;
      return nextId;
    } catch (error) {
      logger.error('Error getting next ID:', error);
      throw error;
    }
  }

  /**
   * Create a new user in the database
   * @param {CreateUserData} userData - User data to create
   * @returns {Promise<User>} Created user object
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      // Get the next available ID
      const nextId = await this.getNextId();
      logger.error(`Next available ID: ${nextId}`);
      const sql = `
        INSERT INTO ${this.tableName} ("Code", "U_Email","Name","U_Role","U_Password","U_CreatedAt","U_UpdatedAt","U_Department","U_LastLogin")
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
      `;

      const params = [
        nextId,
        userData.email,
        userData.fullName,
        userData.role,
        userData.password,
        userData.department,
      ];

      // Execute INSERT
      await db.preparedStatement(sql, params);

      // Get the created user by ID
      const createdUser = await this.findById(nextId);

      if (!createdUser) {
        throw new Error('Failed to create user');
      }

      logger.info(`User created successfully with ID: ${createdUser.id}`);
      return createdUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find a user by email
   * @param {string} email - Email address to search for
   * @returns {Promise<User | null>} User object or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const sql = `SELECT CAST("Code" AS INTEGER) as "id", "U_Email" as "email", "Name" as "fullName", "U_Role" as "role", "U_Password" as "password", "U_CreatedAt" as "createdAt", "U_UpdatedAt" as "updatedAt","U_Department" as "department","U_LastLogin" as "lastLogin" FROM ${this.tableName} WHERE "U_Email" = ?`;
      const result = await db.preparedStatement(sql, [email]);

      logger.info(`Database query result for email ${email}:`, result);
      if (result.length > 0) {
        logger.info(`First result keys:`, Object.keys(result[0]));
        logger.info(`First result values:`, result[0]);
      }

      return result.length > 0 ? (result[0] as User) : null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find a user by ID
   * @param {number} id - User ID to search for
   * @returns {Promise<User | null>} User object or null if not found
   */
  async findById(id: number): Promise<User | null> {
    try {
      const sql = `SELECT CAST("Code" AS INTEGER) as "id", "U_Email" as "email", "Name" as "fullName", "U_Role" as "role", "U_Password" as "password", "U_CreatedAt" as "createdAt", "U_UpdatedAt" as "updatedAt","U_Department" as "department","U_LastLogin" as "lastLogin" FROM ${this.tableName} WHERE "Code" = ?`;
      const result = await db.preparedStatement(sql, [id]);
      
      return result.length > 0 ? (result[0] as User) : null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Get all users from the database
   * @returns {Promise<User[]>} Array of user objects
   */
  async findAll(): Promise<User[]> {
    try {
      const sql = `
        SELECT "Code" as "id", "U_Email" as "email", "Name" as "fullName", "U_Role" as "role", "U_Password" as "password", "U_CreatedAt" as "createdAt", "U_UpdatedAt" as "updatedAt","U_Department" as "department","U_LastLogin" as "lastLogin"
        FROM ${this.tableName} 
        ORDER BY "U_CreatedAt" DESC
      `;
      
      const result = await db.query(sql);
      return result as User[];
    } catch (error) {
      logger.error('Error finding all users:', error);
      throw error;
    }
  }

  /**
   * Update a user by ID
   * @param {number} id - User ID to update
   * @param {UpdateUserData} updateData - Data to update
   * @returns {Promise<User>} Updated user object
   */
  async updateById(id: number, updateData: UpdateUserData): Promise<User> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];

      if (updateData.fullName !== undefined) {
        updateFields.push(`"Name" = ?`);
        params.push(updateData.fullName);
      }

      if (updateData.role !== undefined) {
        updateFields.push(`"U_Role" = ?`);
        params.push(updateData.role);
      }

      if (updateData.department !== undefined) {
        updateFields.push(`"U_Department" = ?`);
        params.push(updateData.department);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`"U_UpdatedAt" = CURRENT_TIMESTAMP`);
      params.push(id);

      const sql = `
        UPDATE ${this.tableName}
        SET ${updateFields.join(', ')}
        WHERE "Code" = ?
      `;

      // Execute UPDATE without RETURNING clause
      await db.preparedStatement(sql, params);

      // Get the updated user by ID
      const updatedUser = await this.findById(id);

      if (!updatedUser) {
        throw new Error('User not found or no changes made');
      }

      logger.info(`User updated successfully with ID: ${id}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user by ID
   * @param {number} id - User ID to delete
   * @returns {Promise<boolean>} True if user was deleted, false otherwise
   */
  async deleteById(id: number): Promise<boolean> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE "Code" = ?`;
      const result = await db.preparedStatement(sql, [id]);
      
      const deleted = result.length > 0;
      if (deleted) {
        logger.info(`User deleted successfully with ID: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Check if an email already exists in the database
   * @param {string} email - Email address to check
   * @param {number} excludeId - Optional user ID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if email exists, false otherwise
   */
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE "U_Email" = ?`;
      const params: any[] = [email];

      if (excludeId !== undefined) {
        sql += ` AND "Code" != ?`;
        params.push(excludeId);
      }

      const result = await db.preparedStatement(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userModel = new UserModel();
export default userModel;
