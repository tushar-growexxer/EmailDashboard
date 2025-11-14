import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Snackbar component for displaying user-friendly notifications
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the snackbar is visible
 * @param {string} props.message - Message to display
 * @param {string} props.variant - Variant: 'success', 'error', 'warning', 'info'
 * @param {number} props.duration - Auto-hide duration in milliseconds (default: 5000)
 * @param {Function} props.onClose - Callback when snackbar is closed
 */
const Snackbar = ({ 
  open, 
  message, 
  variant = 'info', 
  duration = 5000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [open, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for animation to complete
  };

  if (!open && !isVisible) return null;

  const variantStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800/30',
      text: 'text-green-800 dark:text-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800/30',
      text: 'text-red-800 dark:text-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800/30',
      text: 'text-amber-800 dark:text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800/30',
      text: 'text-blue-800 dark:text-blue-200',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  const style = variantStyles[variant] || variantStyles.info;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'fixed top-6 right-6 z-50 max-w-sm transition-all duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px] pointer-events-none'
      )}
    >
      <div
        className={cn(
          'rounded-lg shadow-lg border p-4 flex items-start gap-3',
          style.bg,
          style.border
        )}
      >
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', style.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', style.text)}>
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className={cn(
            'shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
            style.text
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Snackbar;

