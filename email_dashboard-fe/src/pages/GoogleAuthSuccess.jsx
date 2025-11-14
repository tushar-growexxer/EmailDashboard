import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/auth';

/**
 * Google OAuth Success Handler
 * This page handles the redirect after successful Google authentication
 */
const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleGoogleAuth = async () => {
      const redirectParam = searchParams.get('redirect'); // Where to redirect after profile fetch

      console.log('🔍 Google Auth Success Handler');
      console.log('   Redirect param:', redirectParam);
      console.log('   Full URL:', window.location.href);

      try {
        // Cookie is already set by backend
        // Fetch user profile to update context
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/auth/profile`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Profile fetched:', data.user?.email);
          
          if (data.success && data.user) {
            // IMPORTANT: Set user in context AND localStorage using authService
            setUser(data.user);
            
            // Use authService to save user (ensures consistency)
            authService.setUser(data.user);
            
            // Set session timestamps
            const now = Date.now();
            localStorage.setItem('last_activity', now.toString());
            localStorage.setItem('session_start', now.toString());
            
            console.log('✅ User data saved to context and localStorage');
            console.log('   User in localStorage:', !!authService.getUser());
            
            // Wait a moment to ensure state is fully saved
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Redirect based on parameter or onboarding status
            let targetPath = '/email-analytics'; // Default
            
            if (redirectParam === 'onboarding') {
              targetPath = '/onboarding';
              console.log('→ Redirecting to onboarding page');
            } else if (redirectParam) {
              targetPath = `/${redirectParam}`;
              console.log(`→ Redirecting to ${targetPath}`);
            } else {
              // No redirect param - check onboarding status
              const needsOnboarding = data.user.hasCompletedOnboarding === false;
              if (needsOnboarding) {
                targetPath = '/onboarding';
                console.log('→ User needs onboarding, redirecting to onboarding page');
              } else {
                console.log('→ Redirecting to dashboard');
              }
            }
            
            // Use window.location for full page navigation to ensure clean state
            window.location.href = targetPath;
          } else {
            console.log('❌ Profile fetch failed - no user data');
            navigate('/login?error=profile_fetch_failed');
          }
        } else {
          console.log('❌ Profile fetch failed - response not ok:', response.status);
          navigate('/login?error=profile_fetch_failed');
        }
      } catch (error) {
        console.error('❌ Google auth success handler error:', error);
        navigate('/login?error=auth_processing_failed');
      }
    };

    handleGoogleAuth();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md w-full">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Completing sign in...
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
