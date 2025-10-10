import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, X, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Session warning component that appears when session is about to expire
 */
const SessionWarning = () => {
  const navigate = useNavigate();
  const { sessionWarning, extendSession } = useAuth();

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

  const handleLoginRedirect = () => {
    // Clear session and redirect to login
    extendSession();
    navigate('/login');
  };

  // If session is expired, show full-screen overlay with backdrop blur
  if (sessionWarning.expired) {
    return (
      <>
        {/* Backdrop blur overlay - covers entire screen */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          {/* Prevent clicks on background */}
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

          {/* Centered modal */}
          <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-auto animate-fade-in">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Session Expired
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Your session has expired for security reasons. Please log in again to continue.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={handleLoginRedirect}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      Log In Again
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // For session warnings (not expired), show simple notification
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-fade-in">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-lg shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              Session Expiring Soon
            </p>
            <p className="mt-1 text-sm">
              {sessionWarning.message}
            </p>
            <div className="mt-3">
              <div className="-mx-2 -my-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={handleExtendSession}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Extend Session
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="text-yellow-400 hover:text-yellow-600 transition-colors duration-200"
              onClick={handleDismiss}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;
