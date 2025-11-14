import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/auth';
import { authApi } from '../api';
import { useSnackbar } from '../contexts/SnackbarContext';
import domainManagementApi from '../api/domainManagement';

/**
 * ProtectedRoute component that requires authentication
 * Redirects to login page if user is not authenticated
 * Also checks onboarding status for Google users
 */
const ProtectedRoute = ({ children, skipOnboardingCheck = false }) => {
  const { user, isAuthenticated, isLoading, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showError } = useSnackbar();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [isValidatingUser, setIsValidatingUser] = useState(false);
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);

  // Check localStorage for user if context state is not ready
  useEffect(() => {
    // If context is not loading but user is null, check localStorage
    if (!isLoading && !user && !isCheckingAuth) {
      const storedUser = authService.getUser();
      if (storedUser) {
        console.log('ProtectedRoute: User found in localStorage but not in context, refreshing profile...');
        // User exists in localStorage but not in context - refresh profile
        setIsCheckingAuth(true);
        refreshProfile()
          .then((result) => {
            console.log('ProtectedRoute: Profile refresh result:', result?.success ? 'success' : 'failed');
            setIsCheckingAuth(false);
          })
          .catch((error) => {
            console.error('ProtectedRoute: Profile refresh error:', error);
            setIsCheckingAuth(false);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user]); // Intentionally omitting refreshProfile and isCheckingAuth to prevent infinite loops

  // Validate user exists in database
  useEffect(() => {
    const validateUserInDatabase = async () => {
      const currentUser = user || authService.getUser();
      
      // Only validate if we have a user and not already validating
      if (currentUser && !isValidatingUser && !isLoading && !isCheckingAuth) {
        setIsValidatingUser(true);
        try {
          const result = await authApi.getProfile();
          if (!result.success || !result.user) {
            // User doesn't exist in database - clear auth and redirect
            console.warn('ProtectedRoute: User not found in database, clearing auth and redirecting');
            authService.clearLocalData();
            window.location.href = '/login';
            return;
          }
        } catch (error) {
          // If it's a 401, user is not authenticated - let normal flow handle it
          if (error.message && error.message.includes('401')) {
            console.warn('ProtectedRoute: 401 error during user validation');
            // Don't redirect here - let the normal auth check handle it
          } else {
            // Other errors - user might not exist
            console.error('ProtectedRoute: Error validating user:', error);
            authService.clearLocalData();
            window.location.href = '/login';
            return;
          }
        } finally {
          setIsValidatingUser(false);
        }
      }
    };

    validateUserInDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, isCheckingAuth]);

  // Check if user's email domain is allowed
  useEffect(() => {
    const checkDomain = async () => {
      const currentUser = user || authService.getUser();
      
      // Only check if we have a user and not already checking
      if (currentUser?.email && !isCheckingDomain && !isLoading && !isCheckingAuth && !isValidatingUser) {
        setIsCheckingDomain(true);
        try {
          const result = await domainManagementApi.checkDomain(currentUser.email);
          if (result.success && !result.data?.isAllowed) {
            // Domain is not allowed - show error and redirect
            showError("Your company/domain is not allowed to access the website. Please contact admin.");
            authService.clearLocalData();
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 2000);
          }
        } catch (error) {
          console.error('ProtectedRoute: Error checking domain:', error);
          // Don't block access on check error - let backend handle it
        } finally {
          setIsCheckingDomain(false);
        }
      }
    };

    checkDomain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, isCheckingAuth, isValidatingUser]);

  // Show loading while checking authentication, refreshing profile, validating user, or checking domain
  if (isLoading || isCheckingAuth || isValidatingUser || isCheckingDomain) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication - prioritize localStorage for immediate check
  // This handles cases where state hasn't updated yet after profile refresh
  const storedUser = authService.getUser();
  const currentUser = user || storedUser;
  
  // User is authenticated if we have user in context OR localStorage
  // This ensures we don't redirect to login if user exists in localStorage but context hasn't updated
  const isUserAuthenticated = !!currentUser;

  // If not authenticated, try one more time to refresh profile before redirecting
  // This handles cases where cookie exists but user state hasn't loaded yet
  if (!isUserAuthenticated && !isCheckingAuth) {
    // If we have user in localStorage but not in context, try refreshing
    // This handles the case after onboarding where state might not be updated yet
    if (storedUser && !user) {
      console.log('ProtectedRoute: User in localStorage but not in context, attempting profile refresh...');
      setIsCheckingAuth(true);
      refreshProfile()
        .then((result) => {
          console.log('ProtectedRoute: Profile refresh result:', result?.success ? 'success' : 'failed');
          setIsCheckingAuth(false);
        })
        .catch((error) => {
          console.error('ProtectedRoute: Profile refresh error:', error);
          setIsCheckingAuth(false);
        });
      // Show loading while checking
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    // No user in localStorage or context - definitely not authenticated
    console.warn('ProtectedRoute: User not authenticated, redirecting to login', {
      hasContextUser: !!user,
      hasStoredUser: !!storedUser,
      isAuthenticated,
      path: location.pathname,
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  console.log('ProtectedRoute: User authenticated', {
    hasContextUser: !!user,
    hasStoredUser: !!storedUser,
    userEmail: currentUser?.email,
    path: location.pathname,
  });

  // Use currentUser for onboarding check (might be from localStorage fallback)
  const userForCheck = user || currentUser;

  // Check onboarding status for Google users (unless skipped)
  if (!skipOnboardingCheck && userForCheck) {
    // Check if user is a Google user and hasn't completed onboarding
    const isGoogleUser = userForCheck.id && typeof userForCheck.id === 'string' && userForCheck.id.startsWith('google_');
    const needsOnboarding = isGoogleUser && userForCheck.hasCompletedOnboarding === false;

    if (needsOnboarding && location.pathname !== '/onboarding') {
      console.log('ProtectedRoute: User needs onboarding, redirecting', {
        isGoogleUser,
        hasCompletedOnboarding: userForCheck.hasCompletedOnboarding,
        currentPath: location.pathname,
      });
      // Redirect to onboarding if not already there
      return <Navigate to="/onboarding" replace />;
    }
  }

  // User is authenticated and onboarding is complete (or skipped), render the protected component
  return children;
};

export default ProtectedRoute;
