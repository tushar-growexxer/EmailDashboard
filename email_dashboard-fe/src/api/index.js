// API services exports
export { default as authApi, AuthApiService } from './auth.js';
export { default as dashboardApi, DashboardApiService } from './dashboard.js';
export { default as BaseApiService } from './base.js';

// Re-export for backward compatibility
export { default } from './base.js';
