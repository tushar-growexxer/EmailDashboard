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
 * OAuth tokens interface for Google users
 */
export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  expiry_date?: number;
}

/**
 * Google User Interface
 * Represents a user authenticated via Google OAuth
 */
export interface GoogleUser {
  googleId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  role: 'admin' | 'user' | 'manager' | 'super admin';
  isActive: boolean;
  domain?: string; // Email domain (e.g., 'matangiindustries.com')
  manager?: ManagerReference | ManagerReference[]; // Manager(s) assigned to this user (can be multiple)
  hasCompletedOnboarding: boolean; // Track if user has completed onboarding (skip button clicked)
  hasSynced: boolean; // Track if user has actually synced their email (Gmail OAuth completed)
  oauthTokens?: GoogleOAuthTokens; // OAuth tokens for email API access
  createdAt: Date;
  lastLogin: Date;
}

/**
 * Google User Document (for MongoDB)
 */
export interface GoogleUserDocument extends GoogleUser {
  _id?: string;
}
