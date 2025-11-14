import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * SuperAdminRoute component that requires super admin role
 * Redirects to dashboard if user is not super admin
 */
const SuperAdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not super admin, redirect to email-analytics dashboard
  if (user?.role?.toLowerCase() !== 'super admin') {
    return <Navigate to="/email-analytics" replace />;
  }

  // User is authenticated and is super admin, render the protected component
  return children;
};

export default SuperAdminRoute;

