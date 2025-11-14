import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '../components/ui/Snackbar';

/**
 * Snackbar context for managing global notifications
 */
const SnackbarContext = createContext({
  showSnackbar: () => {},
});

/**
 * Snackbar provider component
 */
export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    variant: 'info',
    duration: 5000,
  });

  /**
   * Show a snackbar notification
   * @param {string} message - Message to display
   * @param {string} variant - Variant: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Auto-hide duration in milliseconds
   */
  const showSnackbar = useCallback((message, variant = 'info', duration = 5000) => {
    setSnackbar({
      open: true,
      message,
      variant,
      duration,
    });
  }, []);

  /**
   * Hide the snackbar
   */
  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  /**
   * Convenience methods for different variants
   */
  const showSuccess = useCallback((message, duration) => {
    showSnackbar(message, 'success', duration);
  }, [showSnackbar]);

  const showError = useCallback((message, duration) => {
    showSnackbar(message, 'error', duration);
  }, [showSnackbar]);

  const showWarning = useCallback((message, duration) => {
    showSnackbar(message, 'warning', duration);
  }, [showSnackbar]);

  const showInfo = useCallback((message, duration) => {
    showSnackbar(message, 'info', duration);
  }, [showSnackbar]);

  const value = {
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        variant={snackbar.variant}
        duration={snackbar.duration}
        onClose={hideSnackbar}
      />
    </SnackbarContext.Provider>
  );
};

/**
 * Hook to use snackbar context
 */
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

