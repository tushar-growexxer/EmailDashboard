import ldap from 'ldapjs';
import { getLdapConfig } from '../config/ldap';
import { mongodb } from '../config/mongodb';
import logger from '../config/logger';
import NodeCache = require('node-cache');

/**
 * Manager reference interface
 * Represents a manager assigned to a user
 */
export interface ManagerReference {
  userId: string; // Google ID or sAMAccountName
  email: string;
  displayName: string;
  userType: 'google' | 'ldap'; // Type of user (google or ldap)
}

/**
 * LDAP User interface for syncing to MongoDB
 */
export interface LdapUserData {
  sAMAccountName: string;
  displayName: string;
  userPrincipalName?: string;
  mail?: string;
  cn?: string;
  distinguishedName?: string;
  lastLogin?: Date;
  role: 'user' | 'manager' | 'admin' | 'super admin';
  isActive: boolean;
  domain?: string; // Email domain (e.g., 'matangi.com')
  manager?: ManagerReference | ManagerReference[]; // Manager(s) assigned to this user (can be multiple)
  syncedAt: Date;
}

/**
 * LDAP Sync Service for fetching users from LDAP and storing in MongoDB
 */
export class LdapSyncService {
  private config = getLdapConfig();
  private cache: NodeCache;
  private readonly CACHE_KEY = 'ldap_users';
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor() {
    // Initialize cache with 5 minute TTL
    this.cache = new NodeCache({
      stdTTL: this.CACHE_TTL,
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Better performance
    });
    logger.info('LDAP Sync Service initialized with 5-minute cache');
  }

  /**
   * Fetch all users from LDAP server
   * @returns {Promise<LdapUserData[]>} Array of LDAP users
   */
  async fetchLdapUsers(): Promise<LdapUserData[]> {
    return new Promise((resolve, reject) => {
      const users: LdapUserData[] = [];
      let client: ldap.Client | null = null;

      try {
        logger.info('Starting LDAP user sync...');
        
        // Create LDAP client
        client = ldap.createClient({
          url: this.config.url,
          timeout: this.config.timeout,
          connectTimeout: this.config.connectTimeout,
        });

        // Bind with credentials - try multiple formats
        const bindDNOptions = [
          this.config.bindDN,
          'sap.support@matangi.com',
          'cn=sap.support,dc=matangi,dc=com',
        ].filter((dn): dn is string => Boolean(dn));
        
        const bindPassword = this.config.bindPassword || 'Matangi@123';

        let lastError: any = null;

        const tryBind = (index: number): void => {
          if (index >= bindDNOptions.length) {
            logger.error('All LDAP bind attempts failed. Last error:', lastError);
            if (client) client.unbind();
            reject(new Error(`Login failed: ${lastError?.message || 'Unknown error'}`));
            return;
          }

          const bindDN = bindDNOptions[index];
          logger.debug(`Attempting LDAP bind with: ${bindDN}`);

          client!.bind(bindDN, bindPassword, (bindErr: any) => {
            if (bindErr) {
              lastError = bindErr;
              logger.debug(`Bind failed with ${bindDN}: ${bindErr.message}`);
              tryBind(index + 1);
              return;
            }

            logger.info(`LDAP bind successful with: ${bindDN}`);
            logger.info('Searching for users...');

            // Search for all users
            const searchOptions = {
              scope: 'sub' as const,
              filter: '(objectClass=user)',
              attributes: [
                'sAMAccountName',
                'displayName',
                'userPrincipalName',
                'mail',
                'cn',
                'distinguishedName',
              ],
            };

            client!.search(this.config.baseDN, searchOptions, (searchErr, res) => {
              if (searchErr) {
                logger.error('LDAP search failed:', searchErr);
                if (client) client.unbind();
                reject(new Error(`LDAP search failed: ${searchErr.message}`));
                return;
              }

              res.on('searchEntry', (entry) => {
                // Extract attributes from entry
                const attributes: any = {};
                entry.attributes.forEach((attr: any) => {
                  if (attr.values && attr.values.length > 0) {
                    attributes[attr.type] = attr.values.length === 1 ? attr.values[0] : attr.values;
                  }
                });

                // Only process users with sAMAccountName and skip computer accounts
                if (
                  attributes.sAMAccountName &&
                  attributes.userPrincipalName &&
                  !attributes.userPrincipalName.endsWith('$')
                ) {
                  // Extract domain from email
                  const email = attributes.mail || attributes.userPrincipalName;
                  const domain = email ? email.split('@')[1] : undefined;

                  const ldapUser: LdapUserData = {
                    sAMAccountName: attributes.sAMAccountName,
                    displayName: attributes.displayName || attributes.cn || attributes.sAMAccountName,
                    userPrincipalName: attributes.userPrincipalName,
                    mail: attributes.mail,
                    cn: attributes.cn,
                    distinguishedName: entry.dn.toString(),
                    role: 'user', // Default role
                    isActive: false, // Default inactive
                    domain, // Store domain
                    syncedAt: new Date(),
                  };

                  users.push(ldapUser);
                }
              });

              res.on('error', (err) => {
                logger.error('LDAP search error:', err);
                if (client) client.unbind();
                reject(new Error(`LDAP search error: ${err.message}`));
              });

              res.on('end', () => {
                logger.info(`LDAP search completed. Found ${users.length} valid users`);
                if (client) client.unbind();
                resolve(users);
              });
            });
          });
        };

        tryBind(0);
      } catch (error) {
        logger.error('LDAP sync error:', error);
        if (client) {
          try {
            client.unbind();
          } catch (unbindError) {
            logger.warn('Error unbinding LDAP client:', unbindError);
          }
        }
        reject(error);
      }
    });
  }

  /**
   * Sync LDAP users to MongoDB
   * @returns {Promise<{ success: boolean; usersAdded: number; usersUpdated: number; message: string }>}
   */
  async syncUsersToMongoDB(): Promise<{
    success: boolean;
    usersAdded: number;
    usersUpdated: number;
    totalUsers: number;
    message: string;
  }> {
    try {
      // Fetch users from LDAP
      const ldapUsers = await this.fetchLdapUsers();

      if (ldapUsers.length === 0) {
        return {
          success: true,
          usersAdded: 0,
          usersUpdated: 0,
          totalUsers: 0,
          message: 'No users found in LDAP',
        };
      }

      // Get MongoDB database and collection
      const db = await mongodb.getDatabase();
      const usersDatabase = process.env.USERS_DATABASE || 'users';
      const usersCollection = process.env.LDAP_USERS_COLLECTION || 'ldap-users';
      
      // Switch to users database
      const usersDb = db.client.db(usersDatabase);
      const collection = usersDb.collection(usersCollection);

      // Create unique index on sAMAccountName to prevent duplicates
      try {
        await collection.createIndex({ sAMAccountName: 1 }, { unique: true });
      } catch (indexError) {
        // Index might already exist, that's fine
        logger.debug('Index creation skipped (may already exist)');
      }

      let usersAdded = 0;
      let usersUpdated = 0;

      // Sync each user to MongoDB using upsert
      for (const ldapUser of ldapUsers) {
        try {
          // Use updateOne with upsert to either insert or update
          const result = await collection.updateOne(
            { sAMAccountName: ldapUser.sAMAccountName },
            {
              $set: {
                displayName: ldapUser.displayName,
                userPrincipalName: ldapUser.userPrincipalName,
                mail: ldapUser.mail,
                cn: ldapUser.cn,
                distinguishedName: ldapUser.distinguishedName,
                domain: ldapUser.domain,
                syncedAt: ldapUser.syncedAt,
              },
              $setOnInsert: {
                // These fields are only set when inserting a new document
                role: ldapUser.role,
                isActive: ldapUser.isActive,
                lastLogin: ldapUser.lastLogin,
              },
            },
            { upsert: true }
          );

          // Check if this was an insert or update
          if (result.upsertedCount > 0) {
            usersAdded++;
            logger.debug(`Added new user: ${ldapUser.sAMAccountName}`);
          } else if (result.modifiedCount > 0) {
            usersUpdated++;
            logger.debug(`Updated existing user: ${ldapUser.sAMAccountName}`);
          }
        } catch (userError: any) {
          // Handle duplicate key error gracefully
          if (userError.code === 11000) {
            logger.warn(
              `Duplicate user skipped: ${ldapUser.sAMAccountName}`
            );
          } else {
            logger.error(
              `Error syncing user ${ldapUser.sAMAccountName}:`,
              userError
            );
          }
          // Continue with next user
        }
      }

      logger.info(
        `LDAP sync completed: ${usersAdded} users added, ${usersUpdated} users updated`
      );

      return {
        success: true,
        usersAdded,
        usersUpdated,
        totalUsers: ldapUsers.length,
        message: `Successfully synced ${ldapUsers.length} users (${usersAdded} added, ${usersUpdated} updated)`,
      };
    } catch (error) {
      logger.error('Error syncing LDAP users to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get all synced LDAP users from MongoDB with caching
   * @param {boolean} forceRefresh - Force refresh from database, bypassing cache
   * @returns {Promise<LdapUserData[]>} Array of synced users
   */
  async getSyncedUsers(forceRefresh: boolean = false): Promise<LdapUserData[]> {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedUsers = this.cache.get<LdapUserData[]>(this.CACHE_KEY);
        if (cachedUsers) {
          logger.debug('Returning users from cache');
          return cachedUsers;
        }
      }

      // Fetch from MongoDB
      logger.debug('Fetching users from MongoDB');
      const db = await mongodb.getDatabase();
      const usersDatabase = process.env.USERS_DATABASE || 'users';
      const usersCollection = process.env.LDAP_USERS_COLLECTION || 'ldap-users';
      
      const usersDb = db.client.db(usersDatabase);
      const collection = usersDb.collection(usersCollection);

      const users = await collection
        .find({})
        .sort({ displayName: 1 })
        .toArray();

      const userData = users as unknown as LdapUserData[];

      // Store in cache
      this.cache.set(this.CACHE_KEY, userData);
      logger.info(`Cached ${userData.length} users for ${this.CACHE_TTL} seconds`);

      return userData;
    } catch (error) {
      logger.error('Error getting synced users from MongoDB:', error);
      
      // Fallback: try to return cached data even if expired
      const cachedUsers = this.cache.get<LdapUserData[]>(this.CACHE_KEY);
      if (cachedUsers) {
        logger.warn('Returning stale cached data due to database error');
        return cachedUsers;
      }
      
      throw error;
    }
  }

  /**
   * Clear the users cache
   */
  clearCache(): void {
    this.cache.del(this.CACHE_KEY);
    logger.info('Users cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const keys = this.cache.keys();
    const stats = this.cache.getStats();
    return {
      keys,
      stats,
      ttl: this.CACHE_TTL,
    };
  }

  /**
   * Update user role and active status in MongoDB
   * @param {string} sAMAccountName - User's sAMAccountName
   * @param {object} updates - Fields to update
   * @returns {Promise<boolean>} True if updated successfully
   */
  async updateUserStatus(
    sAMAccountName: string,
    updates: {
      role?: 'user' | 'manager' | 'admin' | 'super admin';
      isActive?: boolean;
      domain?: string;
      manager?: ManagerReference | ManagerReference[];
    }
  ): Promise<boolean> {
    try {
      const db = await mongodb.getDatabase();
      const usersDatabase = process.env.USERS_DATABASE || 'users';
      const usersCollection = process.env.LDAP_USERS_COLLECTION || 'ldap-users';
      
      const usersDb = db.client.db(usersDatabase);
      const collection = usersDb.collection(usersCollection);

      const result = await collection.updateOne(
        { sAMAccountName },
        { $set: updates }
      );

      // Clear cache after update
      if (result.modifiedCount > 0) {
        this.clearCache();
        logger.info('Cache cleared after user update');
      }

      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Delete an LDAP user from MongoDB
   * Also deletes the user from UserManager if they exist there
   * @param {string} sAMAccountName - User's sAMAccountName
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteUser(sAMAccountName: string): Promise<boolean> {
    try {
      const db = await mongodb.getDatabase();
      const usersDatabase = process.env.USERS_DATABASE || 'users';
      const usersCollection = process.env.LDAP_USERS_COLLECTION || 'ldap-users';
      
      const usersDb = db.client.db(usersDatabase);
      const collection = usersDb.collection(usersCollection);

      // Get user email before deleting
      const user = await collection.findOne({ sAMAccountName });
      if (!user) {
        return false;
      }

      // Delete from LDAP users collection
      const result = await collection.deleteOne({ sAMAccountName });
      const deleted = result.deletedCount > 0;

      if (deleted) {
        logger.info(`LDAP user deleted: ${sAMAccountName}`);
        
        // Clear cache after deletion
        this.clearCache();
        
        // Also delete from UserManager if user exists there
        const userEmail = (user as any).mail || (user as any).userPrincipalName;
        if (userEmail) {
          // Terminate user session via external API (non-blocking for LDAP)
          try {
            const { sessionTerminationService } = await import('./sessionTermination.service');
            await sessionTerminationService.terminateSession(userEmail);
          } catch (sessionError) {
            // Log error but don't fail the deletion if session termination fails
            logger.warn(`Failed to terminate session for ${userEmail}: ${sessionError}`);
          }
          
          try {
            const { userManagerService } = await import('./userManager.service');
            await userManagerService.deleteUser(userEmail);
            logger.info(`User also deleted from UserManager: ${userEmail}`);
          } catch (userManagerError) {
            // Log error but don't fail the deletion if UserManager deletion fails
            logger.warn(`Failed to delete user from UserManager: ${userManagerError}`);
          }
        }
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting LDAP user:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ldapSyncService = new LdapSyncService();
export default ldapSyncService;
