/**
 * Session management with activity tracking for cookie-based authentication
 * Since tokens are in httpOnly cookies, session management is based on activity tracking
 * and API-based authentication validation
 */
export class SessionManager {
  static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  static ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
  static WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before expiry

  static LAST_ACTIVITY_KEY = 'last_activity';
  static SESSION_WARNING_SHOWN_KEY = 'session_warning_shown';

  static activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ];

  static listenersAdded = false;
  static checkInterval = null;
  static warningCallback = null;
  static expiredCallback = null;

  static init({ onWarning, onExpired } = {}) {
    this.warningCallback = onWarning;
    this.expiredCallback = onExpired;

    if (!this.listenersAdded) {
      this.addActivityListeners();
      this.listenersAdded = true;
    }

    if (!this.checkInterval) {
      this.startActivityCheck();
    }

    // Set initial activity timestamp only if we have a valid session
    if (this.hasValidSession()) {
      this.updateLastActivity();
    }
  }

  /**
   * Check if we have a valid session (user data exists)
   */
  static hasValidSession() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('user');
  }

  /**
   * Add activity event listeners
   */
  static addActivityListeners() {
    this.activityEvents.forEach((event) => {
      document.addEventListener(event, this.handleActivity.bind(this), { passive: true });
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Handle user activity
   */
  static handleActivity() {
    if (this.hasValidSession()) {
      this.updateLastActivity();
    }
  }

  /**
   * Handle page visibility changes
   */
  static handleVisibilityChange() {
    if (!document.hidden && this.hasValidSession()) {
      this.updateLastActivity();
    }
  }

  /**
   * Update last activity timestamp
   */
  static updateLastActivity() {
    if (typeof window !== 'undefined' && this.hasValidSession()) {
      const now = Date.now();
      localStorage.setItem(this.LAST_ACTIVITY_KEY, now.toString());

      // Clear warning flag when user is active
      localStorage.removeItem(this.SESSION_WARNING_SHOWN_KEY);
    }
  }

  /**
   * Get last activity timestamp
   */
  static getLastActivity() {
    if (typeof window !== 'undefined') {
      const timestamp = localStorage.getItem(this.LAST_ACTIVITY_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    }
    return null;
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired() {
    const lastActivity = this.getLastActivity();
    if (!lastActivity || !this.hasValidSession()) return true;

    const now = Date.now();
    return (now - lastActivity) >= this.SESSION_TIMEOUT;
  }

  /**
   * Get time until session expires (in milliseconds)
   */
  static getTimeUntilExpiry() {
    const lastActivity = this.getLastActivity();
    if (!lastActivity || !this.hasValidSession()) return 0;

    const now = Date.now();
    const elapsed = now - lastActivity;
    return Math.max(0, this.SESSION_TIMEOUT - elapsed);
  }

  /**
   * Check if should show warning
   */
  static shouldShowWarning() {
    if (typeof window === 'undefined' || !this.hasValidSession()) return false;

    const timeUntilExpiry = this.getTimeUntilExpiry();
    const warningShown = localStorage.getItem(this.SESSION_WARNING_SHOWN_KEY);

    return timeUntilExpiry <= this.WARNING_TIME && !warningShown;
  }

  /**
   * Mark warning as shown
   */
  static markWarningShown() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_WARNING_SHOWN_KEY, 'true');
    }
  }

  /**
   * Start periodic activity checks
   */
  static startActivityCheck() {
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, this.ACTIVITY_CHECK_INTERVAL);
  }

  /**
   * Check session status and trigger callbacks
   */
  static checkSession() {
    if (this.isSessionExpired()) {
      this.handleSessionExpired();
    } else if (this.shouldShowWarning()) {
      this.handleSessionWarning();
    }
  }

  /**
   * Handle session warning
   */
  static handleSessionWarning() {
    this.markWarningShown();

    if (this.warningCallback) {
      const minutesLeft = Math.ceil(this.getTimeUntilExpiry() / (60 * 1000));
      this.warningCallback(minutesLeft);
    }
  }

  /**
   * Handle session expired
   */
  static handleSessionExpired() {
    if (this.expiredCallback) {
      this.expiredCallback();
    }
  }

  /**
   * Extend session (for explicit actions like refresh)
   */
  static extendSession() {
    this.updateLastActivity();
  }

  /**
   * Clear session data
   */
  static clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.LAST_ACTIVITY_KEY);
      localStorage.removeItem(this.SESSION_WARNING_SHOWN_KEY);
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Cleanup listeners and intervals
   */
  static cleanup() {
    if (this.listenersAdded) {
      this.activityEvents.forEach((event) => {
        document.removeEventListener(event, this.handleActivity.bind(this));
      });
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      this.listenersAdded = false;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager;
