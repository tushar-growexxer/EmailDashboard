import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import logger from './logger';

/**
 * Configure Passport with Google OAuth 2.0 Strategy
 */
export const configurePassport = (): void => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!googleClientId || !googleClientSecret || !googleCallbackURL) {
    logger.warn('Google OAuth credentials not configured. Google login will be disabled.');
    return;
  }

  // Configure Google OAuth Strategy
  // NOTE: Default scopes for login (profile, email, openid)
  // Sync flow will override with Gmail scope only
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL,
        scope: [
          'openid', // Required to get id_token
          'profile', // User profile information
          'email', // User email address
        ],
      },
      async (accessToken: string, refreshToken: string, params: any, profile: Profile, done: VerifyCallback) => {
        try {
          // Extract id_token from params (token response)
          // params contains the full token response from Google including id_token
          const idToken = params?.id_token || '';

          // Extract actual scope from Google's OAuth response
          // params.scope contains the granted scopes as a space-separated string
          const grantedScope = params?.scope || '';

          // Extract user information from Google profile
          const googleUser = {
            googleId: profile.id,
            email: profile.emails?.[0]?.value || '',
            displayName: profile.displayName,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profilePicture: profile.photos?.[0]?.value || '',
            // Include OAuth tokens with actual granted scope
            oauthTokens: {
              access_token: accessToken,
              refresh_token: refreshToken,
              token_type: 'Bearer',
              scope: grantedScope, // Use actual scope from Google's response
            },
            // Include id_token from OAuth response
            id_token: idToken,
          };

          logger.info(`Google OAuth: User authenticated - ${googleUser.email}`);
          if (idToken) {
            logger.debug(`Google OAuth: id_token received for ${googleUser.email}`);
          } else {
            logger.warn(`Google OAuth: id_token missing for ${googleUser.email}`);
          }
          
          // Pass the user data to the callback
          return done(null, googleUser);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Serialize user for session (not used in JWT approach, but required by passport)
  passport.serializeUser((user: Express.User, done: (err: any, id?: any) => void) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: Express.User, done: (err: any, user?: Express.User | false | null) => void) => {
    done(null, user);
  });

  logger.info('Passport Google OAuth strategy configured');
};

export default passport;
