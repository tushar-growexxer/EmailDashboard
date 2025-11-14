import { Db, Collection } from 'mongodb';
import { mongodb } from '../config/mongodb';
import logger from '../config/logger';
import { GoogleUser, GoogleUserDocument, ManagerReference, GoogleOAuthTokens } from '../models/GoogleUser';
import { userManagerService } from './userManager.service';
import { sessionTerminationService } from './sessionTermination.service';

/**
 * Service for managing Google OAuth users in MongoDB
 */
class GoogleAuthService {
  private db: Db | null = null;
  private collection: Collection<GoogleUserDocument> | null = null;

  /**
   * Initialize MongoDB connection
   */
  private async initialize(): Promise<void> {
    if (!this.collection) {
      const dbName = process.env.USERS_DATABASE || 'users';
      const collectionName = process.env.GOOGLE_USERS_COLLECTION || 'google-users';
      
      // Get the USERS database (not the default analytics database)
      this.db = await mongodb.getDatabaseByName(dbName);
      
      // Get or create collection
      this.collection = this.db.collection<GoogleUserDocument>(collectionName);

      // Create indexes
      await this.collection.createIndex({ googleId: 1 }, { unique: true });
      await this.collection.createIndex({ email: 1 }, { unique: true });
      
      logger.info(`Google Auth Service initialized with database: ${dbName}, collection: ${collectionName}`);
    }
  }

  /**
   * Find or create a Google user
   */
  async findOrCreateUser(googleProfile: {
    googleId: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    oauthTokens?: GoogleOAuthTokens;
  }): Promise<GoogleUser> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Google users collection not initialized');
    }

    // Check if user exists
    let user = await this.collection.findOne({ googleId: googleProfile.googleId });

    if (user) {
      // Check if user exists in USER_DETAILS_COLLECTION with active monitoring
      // If so, they've already synced and should skip onboarding
      let hasActiveMonitoring = false;
      try {
        const userDetails = await userManagerService.getUser(googleProfile.email);
        if (userDetails && userDetails.monitoring_active && userDetails.oauth_tokens) {
          hasActiveMonitoring = true;
          logger.info(`User ${googleProfile.email} has active monitoring in USER_DETAILS_COLLECTION`);
        }
      } catch (error) {
        logger.warn(`Error checking USER_DETAILS_COLLECTION for ${googleProfile.email}:`, error);
        // Continue with normal flow if check fails
      }

      // Update last login and OAuth tokens if provided
      const updateData: any = {
        lastLogin: new Date(),
        displayName: googleProfile.displayName,
        profilePicture: googleProfile.profilePicture,
      };

      // If user has active monitoring, mark onboarding as complete
      if (hasActiveMonitoring && !user.hasCompletedOnboarding) {
        updateData.hasCompletedOnboarding = true;
        logger.info(`Auto-marking onboarding complete for ${googleProfile.email} due to active monitoring`);
      }

      // IMPORTANT: OAuth token update strategy:
      // 1. During LOGIN: Never update tokens if they already exist (preserve sync tokens)
      // 2. During SYNC: Always update tokens with Gmail scopes
      // 3. New users: Set initial tokens (will be auth scopes from login)
      if (googleProfile.oauthTokens) {
        const providedScope = googleProfile.oauthTokens.scope || '';
        const isGmailScope = providedScope.includes('mail.google.com');
        const hasExistingTokens = !!(user.oauthTokens && user.oauthTokens.access_token);

        if (isGmailScope) {
          // SYNC FLOW: Always update tokens with Gmail scopes
          updateData.oauthTokens = googleProfile.oauthTokens;
          logger.info(`Updating OAuth tokens for ${googleProfile.email} (Gmail sync flow with scope: ${providedScope})`);
        } else if (!hasExistingTokens) {
          // LOGIN FLOW - New user: Set initial auth tokens (profile/email scopes only)
          updateData.oauthTokens = googleProfile.oauthTokens;
          logger.info(`Setting initial OAuth tokens for ${googleProfile.email} (login flow, new user, scope: ${providedScope})`);
        } else {
          // LOGIN FLOW - Existing user: Preserve existing tokens (likely sync tokens)
          // Do NOT update tokens during login to avoid overwriting sync tokens with auth tokens
          logger.info(`Preserving existing OAuth tokens for ${googleProfile.email} (login flow, tokens already exist - not updating)`);
        }
      }

      await this.collection.updateOne(
        { googleId: googleProfile.googleId },
        { $set: updateData }
      );

      // If we updated tokens, use the updated tokens; otherwise preserve existing tokens
      const finalOAuthTokens = updateData.oauthTokens || user.oauthTokens;

      logger.info(`Existing Google user logged in: ${user.email}`);
      
      return {
        googleId: user.googleId,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        role: user.role,
        isActive: user.isActive,
        manager: user.manager,
        hasCompletedOnboarding: hasActiveMonitoring || user.hasCompletedOnboarding || false,
        hasSynced: user.hasSynced || false,
        oauthTokens: finalOAuthTokens, // Use updated tokens if we updated them, otherwise existing tokens
        createdAt: user.createdAt,
        lastLogin: new Date(),
      };
    }

    // Extract domain from email
    const domain = googleProfile.email.split('@')[1];

    // Check if user exists in USER_DETAILS_COLLECTION with active monitoring
    // If so, they've already synced and should skip onboarding
    let hasActiveMonitoring = false;
    let hasSyncedEmail = false;
    try {
      const userDetails = await userManagerService.getUser(googleProfile.email);
      if (userDetails && userDetails.monitoring_active && userDetails.oauth_tokens) {
        hasActiveMonitoring = true;
        hasSyncedEmail = true;
        logger.info(`New Google user ${googleProfile.email} has active monitoring in USER_DETAILS_COLLECTION - skipping onboarding`);
      }
    } catch (error) {
      logger.warn(`Error checking USER_DETAILS_COLLECTION for ${googleProfile.email}:`, error);
      // Continue with normal flow if check fails
    }

    // Create new user (active by default for Google OAuth users)
    const newUser: GoogleUserDocument = {
      googleId: googleProfile.googleId,
      email: googleProfile.email,
      displayName: googleProfile.displayName,
      firstName: googleProfile.firstName,
      lastName: googleProfile.lastName,
      profilePicture: googleProfile.profilePicture,
      role: 'user',
      isActive: true, // Auto-activate Google OAuth users
      domain, // Store domain
      // manager field is optional and not set by default
      hasCompletedOnboarding: hasActiveMonitoring, // Skip onboarding if monitoring is already active
      hasSynced: hasSyncedEmail, // Set to true if already synced in USER_DETAILS_COLLECTION
      oauthTokens: googleProfile.oauthTokens,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    await this.collection.insertOne(newUser);
    logger.info(`New Google user created: ${newUser.email}, hasCompletedOnboarding: ${hasActiveMonitoring}`);

    return newUser;
  }

  /**
   * Mark user as having completed onboarding (skip button clicked)
   * This sets hasCompletedOnboarding to true but does NOT set hasSynced
   */
  async completeOnboarding(googleId: string): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Google users collection not initialized');
    }

    const result = await this.collection.updateOne(
      { googleId },
      { $set: { hasCompletedOnboarding: true } }
    );

    logger.info(`User ${googleId} completed onboarding (skipped sync)`);
    return result.modifiedCount > 0;
  }

  /**
   * Mark user as having synced their email (Gmail OAuth completed)
   * This sets both hasCompletedOnboarding and hasSynced to true
   */
  async markAsSynced(googleId: string): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Google users collection not initialized');
    }

    const result = await this.collection.updateOne(
      { googleId },
      { $set: { hasCompletedOnboarding: true, hasSynced: true } }
    );

    logger.info(`User ${googleId} marked as synced`);
    return result.modifiedCount > 0;
  }

  /**
   * Get user by Google ID
   */
  async getUserByGoogleId(googleId: string): Promise<GoogleUser | null> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Google users collection not initialized');
    }

    const user = await this.collection.findOne({ googleId });
    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<GoogleUser | null> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Google users collection not initialized');
    }

    const user = await this.collection.findOne({ email });
    return user;
  }

  /**
   * Get all Google users
   */
  async getAllUsers(): Promise<GoogleUser[]> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Google users collection not initialized');
    }

    const users = await this.collection.find({}).toArray();
    return users;
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(googleId: string, isActive: boolean): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Google users collection not initialized');
    }

    const result = await this.collection.updateOne(
      { googleId },
      { $set: { isActive } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Update user role
   */
  async updateUserRole(googleId: string, role: 'admin' | 'user' | 'manager' | 'super admin'): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Google users collection not initialized');
    }

    const result = await this.collection.updateOne(
      { googleId },
      { $set: { role } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Update user status (role, active status, manager)
   */
  async updateUser(
    googleId: string,
    updates: {
      role?: 'admin' | 'user' | 'manager' | 'super admin';
      isActive?: boolean;
      manager?: ManagerReference | ManagerReference[];
    }
  ): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Google users collection not initialized');
    }

    const result = await this.collection.updateOne(
      { googleId },
      { $set: updates }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Delete a Google user by Google ID
   * Also deletes the user from UserManager if they exist there
   * IMPORTANT: This is transactional - user is only deleted if session termination succeeds
   */
  async deleteUser(googleId: string): Promise<boolean> {
    logger.info('[GOOGLE-AUTH-SERVICE] ========== Delete User ==========');
    logger.info(`[GOOGLE-AUTH-SERVICE] Google ID: ${googleId}`);
    
    await this.initialize();

    if (!this.collection) {
      logger.error('[GOOGLE-AUTH-SERVICE] Collection not initialized');
      throw new Error('Google users collection not initialized');
    }

    // Get user email before deleting
    logger.info('[GOOGLE-AUTH-SERVICE] Looking up user in MongoDB...');
    const user = await this.collection.findOne({ googleId });
    
    if (!user) {
      logger.warn(`[GOOGLE-AUTH-SERVICE] User not found with googleId: ${googleId}`);
      return false;
    }
    
    logger.info(`[GOOGLE-AUTH-SERVICE] User found: ${user.email}`);
    logger.info(`[GOOGLE-AUTH-SERVICE] User details:`, {
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive
    });

    // CRITICAL: Terminate session FIRST before deleting user
    // This ensures the thread is stopped before user deletion
    logger.info('[GOOGLE-AUTH-SERVICE] Terminating user session (must succeed before deletion)...');
    const sessionTerminated = await sessionTerminationService.terminateSession(user.email);
    
    if (!sessionTerminated) {
      logger.error('[GOOGLE-AUTH-SERVICE] ❌ Session termination failed - aborting user deletion');
      logger.error('[GOOGLE-AUTH-SERVICE] User will NOT be deleted from MongoDB');
      throw new Error(`Failed to terminate session for ${user.email}. User deletion aborted.`);
    }
    
    logger.info(`[GOOGLE-AUTH-SERVICE] ✓ Session terminated successfully for ${user.email}`);
    logger.info('[GOOGLE-AUTH-SERVICE] Proceeding with user deletion...');

    // Only delete from MongoDB if session termination succeeded
    logger.info('[GOOGLE-AUTH-SERVICE] Deleting from Google users collection...');
    const result = await this.collection.deleteOne({ googleId });
    const deleted = result.deletedCount > 0;
    logger.info(`[GOOGLE-AUTH-SERVICE] Delete result: ${deleted ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`[GOOGLE-AUTH-SERVICE] Deleted count: ${result.deletedCount}`);

    if (deleted) {
      logger.info(`[GOOGLE-AUTH-SERVICE] ✓ Google user deleted from MongoDB: ${user.email}`);
      
      // Also delete from UserManager if user exists there
      logger.info('[GOOGLE-AUTH-SERVICE] Deleting from UserManager (EMAIL_DATABASE)...');
      try {
        const userManagerDeleted = await userManagerService.deleteUser(user.email);
        if (userManagerDeleted) {
          logger.info(`[GOOGLE-AUTH-SERVICE] ✓ User also deleted from UserManager: ${user.email}`);
        } else {
          logger.info(`[GOOGLE-AUTH-SERVICE] User not found in UserManager (may not have synced email): ${user.email}`);
        }
      } catch (userManagerError) {
        // Log error but don't fail the deletion if UserManager deletion fails
        logger.warn(`[GOOGLE-AUTH-SERVICE] ⚠ Failed to delete user from UserManager:`, userManagerError);
      }
      
      logger.info('[GOOGLE-AUTH-SERVICE] ========== Delete Complete ==========');
    } else {
      logger.error('[GOOGLE-AUTH-SERVICE] ❌ Failed to delete user from MongoDB');
    }

    return deleted;
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();
export default googleAuthService;
