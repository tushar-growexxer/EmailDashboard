import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, UserCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/auth';

const EmailOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const completeOnboarding = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      console.log('🔄 Completing onboarding...');
      console.log('   API URL:', `${apiBaseUrl}/api/v1/onboarding/complete`);
      
      const response = await fetch(`${apiBaseUrl}/api/v1/onboarding/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('   Response status:', response.status);
      console.log('   Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Onboarding marked complete');
        // Refresh user profile to get updated onboarding status
        const refreshResult = await refreshProfile();
        if (refreshResult && refreshResult.success) {
          console.log('✅ Profile refreshed, user:', refreshResult.user?.email);
          console.log('   User data saved to localStorage:', !!authService.getUser());
          // Wait a bit to ensure state is fully updated and persisted
          await new Promise(resolve => setTimeout(resolve, 500));
          return true;
        } else {
          console.error('❌ Failed to refresh profile:', refreshResult?.message || 'Unknown error');
          // Even if refresh fails, if onboarding was marked complete, we can proceed
          // The ProtectedRoute will handle authentication check
          return true;
        }
      } else {
        console.error('❌ Failed to mark onboarding complete:', data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      return false;
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/v1/onboarding/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔄 Sync response:', data);

      if (response.ok && data.success) {
        // If redirectUrl is provided, redirect to Gmail OAuth
        if (data.redirectUrl) {
          console.log('✅ Redirecting to Gmail authorization:', data.redirectUrl);
          // Redirect to the Gmail sync OAuth endpoint
          window.location.href = data.redirectUrl;
        } else {
          // Fallback: refresh profile and navigate
          console.log('✅ Onboarding marked complete, refreshing profile...');
          const refreshResult = await refreshProfile();
          
          if (refreshResult && refreshResult.success && refreshResult.user) {
            console.log('✅ Profile refreshed successfully');
            window.location.href = '/email-analytics';
          } else {
            console.error('❌ Failed to refresh profile');
            alert('Failed to complete onboarding. Please try again.');
          }
        }
      } else {
        console.error('❌ Failed to initiate sync:', data.message);
        alert(data.message || 'Failed to initiate Gmail sync. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error in handleSync:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      console.log('🔄 Skipping onboarding...');
      console.log('   API URL:', `${apiBaseUrl}/api/v1/onboarding/skip`);
      
      const response = await fetch(`${apiBaseUrl}/api/v1/onboarding/skip`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('   Response status:', response.status);
      console.log('   Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Onboarding skipped');
        // Refresh user profile to get updated onboarding status
        const refreshResult = await refreshProfile();
        
        if (refreshResult && refreshResult.success && refreshResult.user) {
          console.log('✅ Profile refreshed successfully');
          console.log('   User data:', {
            id: refreshResult.user.id,
            email: refreshResult.user.email,
            hasCompletedOnboarding: refreshResult.user.hasCompletedOnboarding,
            hasSynced: refreshResult.user.hasSynced,
          });
          
          // Verify user is in localStorage
          const storedUser = authService.getUser();
          console.log('   User in localStorage:', !!storedUser);
          
          if (storedUser) {
            console.log('✅ User confirmed, navigating to dashboard...');
            // Use window.location for a full page navigation to ensure clean state
            window.location.href = '/email-analytics';
          } else {
            console.error('❌ User not found in localStorage after refresh');
            alert('Authentication error. Please try logging in again.');
            navigate('/login', { replace: true });
          }
        } else {
          console.error('❌ Failed to refresh profile:', refreshResult?.message);
          // Check if user exists in localStorage despite refresh failure
          const storedUser = authService.getUser();
          if (storedUser) {
            console.log('⚠️ Profile refresh failed but user exists in localStorage, navigating anyway...');
            window.location.href = '/email-analytics';
          } else {
            console.error('❌ No user data available');
            alert('Failed to complete onboarding. Please try logging in again.');
            navigate('/login', { replace: true });
          }
        }
      } else {
        console.error('❌ Failed to skip onboarding:', data.message);
        alert(data.message || 'Failed to skip onboarding. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error in handleSkip:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 lg:p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-4 sm:mb-6 lg:mb-8">
          <img
            src="/src/assets/email-pilot_powered_by_growexx.png"
            alt="Email Pilot powered by GrowExx"
            className="h-12 sm:h-16 w-auto"
          />
        </div>

        {/* Onboarding Card */}
        <Card className="shadow-2xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 animate-scale-up">
          <CardHeader className="text-center space-y-2 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl">Welcome, {user?.fullName || 'User'}!</CardTitle>
            <CardDescription className="text-sm sm:text-base lg:text-lg">
              Choose how you'd like to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Sync Option */}
              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer group hover:shadow-lg">
                <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Sync Email</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                      Start monitoring your email communications and get real-time insights
                    </p>
                  </div>
                  <Button
                    onClick={handleSync}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                    disabled={isLoading}
                    size="sm"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{isLoading ? 'Processing...' : 'Sync Now'}</span>
                    <span className="sm:hidden">{isLoading ? '...' : 'Sync'}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recommended for team members
                  </p>
                </CardContent>
              </Card>

              {/* Skip Option */}
              <Card className="border-2 border-gray-200 hover:border-gray-400 transition-all cursor-pointer group hover:shadow-lg">
                <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Skip for Now</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                      Go directly to the dashboard. You can set up email sync later
                    </p>
                  </div>
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="w-full text-sm sm:text-base"
                    disabled={isLoading}
                    size="sm"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{isLoading ? 'Processing...' : 'Skip (Manager)'}</span>
                    <span className="sm:hidden">{isLoading ? '...' : 'Skip'}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recommended for managers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Info Section */}
            <div className="mt-4 sm:mt-6 lg:mt-8 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                What is Email Sync?
              </h4>
              <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-5 sm:ml-6 list-disc">
                <li>Automatically track customer email communications</li>
                <li>Monitor response times and sentiment analysis</li>
                <li>Get real-time insights on email performance</li>
                <li>View analytics and reports on your dashboard</li>
              </ul>
            </div>

            {/* Help Text */}
            <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              You can change these settings anytime from your dashboard
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
          © {new Date().getFullYear()} Matangi Industries LLP. All rights reserved.
        </p>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-up {
          animation: scale-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EmailOnboarding;
