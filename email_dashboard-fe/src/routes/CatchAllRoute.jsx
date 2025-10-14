import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * CatchAllRoute component that redirects users based on authentication status
 * - If authenticated: redirect to /email-analytics
 * - If not authenticated: redirect to /login
 */
const CatchAllRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect authenticated users to email-analytics
  if (isAuthenticated) {
    return <Navigate to="/email-analytics" replace />;
  }

  // Redirect unauthenticated users to login
  return <Navigate to="/login" replace />;
};

export default CatchAllRoute;
