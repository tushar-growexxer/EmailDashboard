import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, LogIn, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ui/Dialog';

/**
 * Session warning component that appears when session is about to expire
 */
const SessionWarning = () => {
  const navigate = useNavigate();
  const { sessionWarning, extendSession, logout } = useAuth();

  if (!sessionWarning?.show) {
    return null;
  }

  const handleExtendSession = () => {
    extendSession();
  };

  const handleDismiss = () => {
    // Just clear the warning, don't extend session
    extendSession();
  };

  const handleLoginRedirect = async () => {
    // Properly logout and clear all data before redirecting
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    navigate('/login', { replace: true });
  };

  // If session is expired, show confirmation dialog
  if (sessionWarning.expired) {
    return (
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Session Expired"
        description="Your session has expired for security reasons. Please log in again to continue using the application."
        icon={AlertTriangle}
        iconClassName="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
        confirmText={
          <>
            <LogIn className="h-4 w-4" />
            Log In Again
          </>
        }
        cancelText="Close"
        onConfirm={handleLoginRedirect}
        onCancel={handleDismiss}
        variant="destructive"
      />
    );
  }

  // For session warnings (not expired), show enhanced notification
  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-800/30 dark:to-orange-800/30">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Session Expiring Soon
                </p>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed mb-4">
                {sessionWarning.message}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleExtendSession}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Extend Session
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-lg text-sm font-medium border border-amber-200 dark:border-amber-700 transition-all duration-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                className="text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300 transition-colors duration-200 p-1"
                onClick={handleDismiss}
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar showing time remaining */}
        <div className="h-1 bg-amber-200 dark:bg-amber-800/30">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-1000 ease-linear"
            style={{
              width: `${Math.max(0, ((30 - (sessionWarning.minutesLeft || 5)) / 30) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;
