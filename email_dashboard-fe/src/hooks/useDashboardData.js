import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for fetching and managing dashboard data
 * 
 * Features:
 * - Automatic data fetching on mount
 * - Loading and error states
 * - Manual refresh capability
 * - Cache status monitoring (backend cache via node-cache)
 * - User-specific data filtering
 * 
 * Note: Caching is handled on the backend with automatic invalidation at 7 AM daily
 * 
 * @param {Object} options - Hook configuration
 * @param {string} options.type - Dashboard type: 'response' or 'aging'
 * @param {number|null} options.userId - Optional user ID for user-specific data
 * @param {boolean} options.autoFetch - Auto-fetch data on mount (default: true)
 * 
 * @returns {Object} Dashboard data and control functions
 */
export function useDashboardData({ type = 'response', userId = null, autoFetch = true } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const { user } = useAuth();

  /**
   * Fetch dashboard data from API (cached on backend)
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      // Fetch user-specific data if userId provided
      if (userId) {
        response = type === 'response'
          ? await dashboardApi.getResponseDashboardByUser(userId)
          : await dashboardApi.getAgingDashboardByUser(userId);
      } else {
        // Fetch all data
        response = type === 'response'
          ? await dashboardApi.getResponseDashboard()
          : await dashboardApi.getAgingDashboard();
      }

      if (response.success) {
        // Handle single user data vs array of all users
        const fetchedData = Array.isArray(response.data) ? response.data : [response.data];
        setData(fetchedData);
        setLastFetched(new Date());
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error(`Error fetching ${type} dashboard data:`, err);
      
      // Handle 401 errors gracefully - don't break the UI
      // The base API service will handle redirect if needed
      if (err.message && err.message.includes('401')) {
        console.warn('401 error in dashboard data fetch - authentication issue');
        // Don't set error for 401 - let ProtectedRoute handle authentication
        // Just set empty data so UI doesn't break
        setData([]);
        setError(null); // Clear error so UI doesn't show error state
      } else {
        // Convert technical error messages to user-friendly ones
        let userFriendlyMessage = err.message || 'Failed to load dashboard data';
        
        if (err.message && (err.message.includes('User not found') || err.message.includes('user not found'))) {
          userFriendlyMessage = 'User not found in database';
        } else if (err.message && (err.message.includes('Network') || err.message.includes('fetch'))) {
          userFriendlyMessage = 'Network error - unable to connect to server';
        } else if (err.message && err.message.includes('403')) {
          userFriendlyMessage = 'Access denied';
        }
        
        setError(userFriendlyMessage);
        setData([]); // Set empty array on error
      }
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  /**
   * Refresh data manually
   */
  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  /**
   * Force backend cache refresh (admin only)
   */
  const refreshCache = useCallback(async () => {
    try {
      const response = await dashboardApi.refreshCache();
      if (response.success) {
        // Re-fetch data after backend cache refresh
        await fetchData();
        return { success: true, message: 'Cache refreshed successfully' };
      } else {
        throw new Error(response.message || 'Failed to refresh cache');
      }
    } catch (err) {
      console.error('Error refreshing cache:', err);
      return { success: false, message: err.message };
    }
  }, [fetchData]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && user) {
      // Add a small delay to ensure cookies are set after navigation
      const timer = setTimeout(() => {
        fetchData();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [autoFetch, fetchData, user]);

  return {
    data,
    loading,
    error,
    lastFetched,
    refresh,
    refreshCache,
    isEmpty: !loading && data.length === 0,
  };
}

/**
 * Custom hook for MongoDB health monitoring
 * 
 * @returns {Object} Health status and check function
 */
export function useDashboardHealth() {
  const [isHealthy, setIsHealthy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.healthCheck();
      setIsHealthy(response.success && response.status === 'connected');
      setLastChecked(new Date());
    } catch (err) {
      console.error('Health check failed:', err);
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isHealthy,
    loading,
    lastChecked,
    checkHealth,
  };
}

/**
 * Custom hook for cache status monitoring
 * 
 * @returns {Object} Cache status and statistics
 */
export function useCacheStatus() {
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.getCacheStatus();
      if (response.success) {
        setCacheStatus(response.status);
      }
    } catch (err) {
      console.error('Error fetching cache status:', err);
      setCacheStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cacheStatus,
    loading,
    fetchStatus,
  };
}

/**
 * Hook to get current user's dashboard data
 * Automatically uses authenticated user's ID
 */
export function useMyDashboardData(type = 'response') {
  const { user } = useAuth();
  
  return useDashboardData({
    type,
    userId: user?.id || null,
    autoFetch: !!user,
  });
}

export default useDashboardData;

