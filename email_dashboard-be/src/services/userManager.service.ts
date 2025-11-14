import { Db, Collection } from 'mongodb';
import { mongodb } from '../config/mongodb';
import logger from '../config/logger';

/**
 * OAuth tokens interface - matches Python auth_handler.py structure
 * NOTE: scope and granted_scopes are not stored - only access/refresh tokens needed
 */
export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  // scope?: string; // Not stored - not needed
  id_token?: string; // JWT token from Google
  // granted_scopes?: string[]; // Not stored - not needed
  username?: string; // User's email
  full_name?: string; // User's full name
  expires_at?: number; // Unix timestamp when token expires
  created_at?: number; // Unix timestamp when token was created
}

/**
 * User details document interface for MongoDB
 */
export interface UserDetailsDocument {
  sequential_id: number;
  username: string;
  full_name?: string;
  oauth_tokens: OAuthTokens;
  last_processed_uid?: number | null;
  uid_updated_at?: Date | null;
  is_active: boolean;
  monitoring_active: boolean;
  granted_scopes?: string[];
  client_id?: string;
  client_secret?: string;
  created_at: Date;
  updated_at?: Date;
}

/**
 * UserManager service class
 * Manages user details and authentication tokens in MongoDB for multi-tenant system
 */
export class UserManagerService {
  private db: Db | null = null;
  private collection: Collection<UserDetailsDocument> | null = null;
  private isInitialized: boolean = false;
  private readonly lock: Map<string, Promise<void>> = new Map();

  /**
   * Initialize MongoDB connection and collection
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized && this.collection) {
      return;
    }

    try {
      // Use EMAIL_DATABASE instead of USERS_DATABASE for token storage
      const dbName = process.env.EMAIL_DATABASE || 'maildb';
      const collectionName = process.env.USER_DETAILS_COLLECTION || 'UserDetails';

      // Get the database
      this.db = await mongodb.getDatabaseByName(dbName);

      // Get or create collection
      this.collection = this.db.collection<UserDetailsDocument>(collectionName);

      // Create indexes for efficient querying
      await this._ensureIndexes();

      this.isInitialized = true;
      logger.info(`UserManager Service initialized with database: ${dbName}, collection: ${collectionName}`);
    } catch (error) {
      logger.error('Error initializing UserManager Service:', error);
      throw error;
    }
  }

  /**
   * Create necessary indexes for the UserDetails collection
   */
  private async _ensureIndexes(): Promise<void> {
    if (!this.collection) {
      return;
    }

    try {
      // Index on username for fast lookups
      await this.collection.createIndex({ username: 1 }, { unique: true });
      // Index on sequential_id for fast lookups
      await this.collection.createIndex({ sequential_id: 1 }, { unique: true });
      // Index on active status
      await this.collection.createIndex({ is_active: 1 });
      logger.debug('UserDetails collection indexes created');
    } catch (error) {
      logger.warning(`Error creating indexes: ${error}`);
    }
  }

  /**
   * Get the next sequential ID for a new user
   */
  private async _getNextSequentialId(): Promise<number> {
    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    try {
      // Find the highest sequential_id and increment it
      const highest = await this.collection.findOne(
        {},
        { sort: { sequential_id: -1 } }
      );

      if (highest && highest.sequential_id) {
        return highest.sequential_id + 1;
      } else {
        return 1; // First user gets ID 1
      }
    } catch (error) {
      logger.error(`Error getting next sequential ID: ${error}`);
      return 1;
    }
  }

  /**
   * Acquire a lock for a specific operation
   */
  private async acquireLock(key: string): Promise<() => void> {
    // Wait for any existing lock to complete
    const existingLock = this.lock.get(key);
    if (existingLock) {
      await existingLock;
    }

    // Create a new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.lock.set(key, lockPromise);

    return () => {
      releaseLock();
      this.lock.delete(key);
    };
  }

  /**
   * Add a new user to the system with their OAuth tokens
   * @param username - User's email address
   * @param oauthTokens - OAuth token dictionary
   * @param fullName - User's full name
   * @param clientId - Optional client ID
   * @param clientSecret - Optional client secret
   * @returns Sequential integer ID for the user (1, 2, 3, ...)
   */
  async addUser(
    username: string,
    oauthTokens: OAuthTokens,
    fullName: string = '',
    clientId?: string,
    clientSecret?: string
  ): Promise<number> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const releaseLock = await this.acquireLock(`add_user_${username}`);

    try {
      // Check if user already exists
      const existingUser = await this.collection.findOne({ username });

      if (existingUser) {
        // Update tokens and reactivate user
        const updateData: Partial<UserDetailsDocument> = {
          oauth_tokens: oauthTokens,
          is_active: true,
          updated_at: new Date(),
        };

        if (clientId) {
          updateData.client_id = clientId;
        }
        if (clientSecret) {
          updateData.client_secret = clientSecret;
        }

        await this.collection.updateOne(
          { username },
          { $set: updateData }
        );

        logger.info(`Existing user updated: ${username} (ID: ${existingUser.sequential_id})`);
        return existingUser.sequential_id;
      }

      // Get next sequential ID
      const sequentialId = await this._getNextSequentialId();

      const userDoc: UserDetailsDocument = {
        sequential_id: sequentialId,
        username,
        full_name: fullName,
        oauth_tokens: oauthTokens,
        last_processed_uid: null,
        uid_updated_at: null,
        is_active: true,
        monitoring_active: false,
        // NOTE: granted_scopes removed - not needed in UserDetails
        created_at: new Date(),
      };

      // Add user-specific OAuth credentials if provided
      if (clientId) {
        userDoc.client_id = clientId;
      }
      if (clientSecret) {
        userDoc.client_secret = clientSecret;
      }

      // Insert new user
      const result = await this.collection.insertOne(userDoc);

      if (result.insertedId) {
        logger.info(`New user added: ${username} (Sequential ID: ${sequentialId})`);
        return sequentialId;
      } else {
        throw new Error('Failed to insert user document');
      }
    } catch (error) {
      logger.error(`Failed to add user ${username}: ${error}`);
      throw error;
    } finally {
      releaseLock();
    }
  }

  /**
   * Get user details by username
   */
  async getUser(username: string): Promise<UserDetailsDocument | null> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    try {
      return await this.collection.findOne({ username });
    } catch (error) {
      logger.error(`Failed to get user ${username}: ${error}`);
      return null;
    }
  }

  /**
   * Get user details by sequential ID
   */
  async getUserById(sequentialId: number): Promise<UserDetailsDocument | null> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    try {
      return await this.collection.findOne({ sequential_id: sequentialId });
    } catch (error) {
      logger.error(`Failed to get user by ID ${sequentialId}: ${error}`);
      return null;
    }
  }

  /**
   * Get all active users
   */
  async getAllActiveUsers(): Promise<UserDetailsDocument[]> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    try {
      return await this.collection.find({ is_active: true }).toArray();
    } catch (error) {
      logger.error(`Failed to get active users: ${error}`);
      return [];
    }
  }

  /**
   * Update OAuth tokens for a user
   */
  async updateOAuthTokens(username: string, oauthTokens: OAuthTokens): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const releaseLock = await this.acquireLock(`update_tokens_${username}`);

    try {
      const result = await this.collection.updateOne(
        { username },
        {
          $set: {
            oauth_tokens: oauthTokens,
            updated_at: new Date(),
          },
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error(`Failed to update tokens for ${username}: ${error}`);
      return false;
    } finally {
      releaseLock();
    }
  }

  /**
   * Get OAuth tokens for a user
   */
  async getOAuthTokens(username: string): Promise<OAuthTokens | null> {
    try {
      const user = await this.getUser(username);
      return user?.oauth_tokens || null;
    } catch (error) {
      logger.error(`Failed to get tokens for ${username}: ${error}`);
      return null;
    }
  }

  /**
   * Update the last processed UID for a user
   */
  async updateLastProcessedUid(username: string, uid: number): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const releaseLock = await this.acquireLock(`update_uid_${username}`);

    try {
      const result = await this.collection.updateOne(
        { username },
        {
          $set: {
            last_processed_uid: uid,
            uid_updated_at: new Date(),
          },
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error(`Failed to update UID for ${username}: ${error}`);
      return false;
    } finally {
      releaseLock();
    }
  }

  /**
   * Get the last processed UID for a user
   */
  async getLastProcessedUid(username: string): Promise<number | null> {
    try {
      const user = await this.getUser(username);
      return user?.last_processed_uid || null;
    } catch (error) {
      logger.error(`Failed to get last UID for ${username}: ${error}`);
      return null;
    }
  }

  /**
   * Set monitoring status for a user
   */
  async setMonitoringStatus(username: string, status: boolean): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const releaseLock = await this.acquireLock(`set_monitoring_${username}`);

    try {
      const result = await this.collection.updateOne(
        { username },
        {
          $set: {
            monitoring_active: status,
            updated_at: new Date(),
          },
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error(`Failed to set monitoring status for ${username}: ${error}`);
      return false;
    } finally {
      releaseLock();
    }
  }

  /**
   * Check if monitoring is active for a user
   */
  async isUserMonitoringActive(username: string): Promise<boolean> {
    try {
      const user = await this.getUser(username);
      return user?.monitoring_active || false;
    } catch (error) {
      logger.error(`Failed to check monitoring status for ${username}: ${error}`);
      return false;
    }
  }

  /**
   * Deactivate a user (stop monitoring but keep data)
   */
  async deactivateUser(username: string): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const releaseLock = await this.acquireLock(`deactivate_${username}`);

    try {
      const result = await this.collection.updateOne(
        { username },
        {
          $set: {
            is_active: false,
            monitoring_active: false,
            updated_at: new Date(),
          },
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error(`Failed to deactivate user ${username}: ${error}`);
      return false;
    } finally {
      releaseLock();
    }
  }

  /**
   * Delete a user and their tokens
   */
  async deleteUser(username: string): Promise<boolean> {
    logger.info('[USER-MANAGER-SERVICE] ========== Delete User ==========');
    logger.info(`[USER-MANAGER-SERVICE] Username: ${username}`);
    
    await this.initialize();

    if (!this.collection) {
      logger.error('[USER-MANAGER-SERVICE] Collection not initialized');
      throw new Error('Collection not initialized');
    }

    logger.info('[USER-MANAGER-SERVICE] Acquiring lock...');
    const releaseLock = await this.acquireLock(`delete_${username}`);
    logger.info('[USER-MANAGER-SERVICE] Lock acquired');

    try {
      logger.info('[USER-MANAGER-SERVICE] Checking if user exists...');
      const existingUser = await this.collection.findOne({ username });
      
      if (!existingUser) {
        logger.info(`[USER-MANAGER-SERVICE] User not found in UserDetails: ${username}`);
        return false;
      }
      
      logger.info(`[USER-MANAGER-SERVICE] User found:`, {
        username: existingUser.username,
        sequential_id: existingUser.sequential_id,
        full_name: existingUser.full_name,
        is_active: existingUser.is_active,
        monitoring_active: existingUser.monitoring_active
      });

      logger.info('[USER-MANAGER-SERVICE] Deleting user from UserDetails collection...');
      const result = await this.collection.deleteOne({ username });
      const deleted = result.deletedCount > 0;
      
      logger.info(`[USER-MANAGER-SERVICE] Delete result: ${deleted ? 'SUCCESS' : 'FAILED'}`);
      logger.info(`[USER-MANAGER-SERVICE] Deleted count: ${result.deletedCount}`);

      if (deleted) {
        logger.info(`[USER-MANAGER-SERVICE] ✓ User deleted successfully from UserDetails: ${username}`);
      } else {
        logger.warn(`[USER-MANAGER-SERVICE] ⚠ Failed to delete user from UserDetails: ${username}`);
      }

      logger.info('[USER-MANAGER-SERVICE] ========== Delete Complete ==========');
      return deleted;
    } catch (error) {
      logger.error('[USER-MANAGER-SERVICE] ========== Delete User Error ==========');
      logger.error(`[USER-MANAGER-SERVICE] Username: ${username}`);
      logger.error('[USER-MANAGER-SERVICE] Error details:', error);
      if (error instanceof Error) {
        logger.error(`[USER-MANAGER-SERVICE] Error message: ${error.message}`);
      }
      return false;
    } finally {
      logger.info('[USER-MANAGER-SERVICE] Releasing lock...');
      releaseLock();
      logger.info('[USER-MANAGER-SERVICE] Lock released');
    }
  }

  /**
   * Delete a user by sequential ID
   */
  async deleteUserById(sequentialId: number): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    try {
      const user = await this.getUserById(sequentialId);
      if (!user) {
        return false;
      }

      return await this.deleteUser(user.username);
    } catch (error) {
      logger.error(`Failed to delete user by ID ${sequentialId}: ${error}`);
      return false;
    }
  }

  /**
   * Get statistics about users in the system
   */
  async getUserStats(): Promise<{
    total_users: number;
    active_users: number;
    monitoring_users: number;
  }> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    try {
      const totalUsers = await this.collection.countDocuments({});
      const activeUsers = await this.collection.countDocuments({ is_active: true });
      const monitoringUsers = await this.collection.countDocuments({ monitoring_active: true });

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        monitoring_users: monitoringUsers,
      };
    } catch (error) {
      logger.error(`Failed to get user stats: ${error}`);
      return { total_users: 0, active_users: 0, monitoring_users: 0 };
    }
  }

  /**
   * Get sequential ID by username
   */
  async getUserIdByUsername(username: string): Promise<number | null> {
    try {
      const user = await this.getUser(username);
      return user?.sequential_id || null;
    } catch (error) {
      logger.error(`Failed to get user ID for ${username}: ${error}`);
      return null;
    }
  }
}

// Export singleton instance
export const userManagerService = new UserManagerService();
export default userManagerService;

