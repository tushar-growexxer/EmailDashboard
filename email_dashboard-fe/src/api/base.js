// Base API service for backend communication
// Use VITE_API_BASE_URL for full URL (with port 3000) or VITE_API_URL for relative path
// Prefer full URL to ensure cookies are sent correctly
// Default to localhost:3000 if not set to ensure cookies work
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to localhost:3000 for development to ensure cookies are sent correctly
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api/v1';
  }
  return '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API base URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
  console.log('🔧 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL);
}

/**
 * Generic API request handler with error handling
 */
class BaseApiService {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Log the full URL in development for debugging
    if (import.meta.env.DEV) {
      console.log('🌐 API Request:', url);
    }

    // Get user data to check if authenticated
    const userData = localStorage.getItem('user');
    const hasUser = !!userData;

    const config = {
      credentials: 'include', // Include cookies in request - CRITICAL for httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Only add Authorization header if we have user data (not actual token)
    if (hasUser) {
      // The actual token is in httpOnly cookies, so we don't need to add it manually
      // The browser will automatically include the auth_token cookie
    } else {
      // Log warning if making authenticated request without user data
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/validate')) {
        console.warn('Making API request without user data in localStorage. User may need to log in.');
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle authentication errors
        if (response.status === 401) {
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath.includes('/login') || 
                            currentPath.includes('/auth/google') || 
                            currentPath.includes('/onboarding');
          
          console.error('API 401 Error:', {
            endpoint,
            message: errorData.message,
            currentPath,
            isAuthPage,
            hasUserInStorage: !!localStorage.getItem('user'),
            cookies: document.cookie,
          });
          
          // For auth-related endpoints, don't redirect - let the auth flow handle it
          const isAuthEndpoint = endpoint.includes('/auth/');
          
          // Only clear localStorage and redirect if:
          // 1. Not on an auth page
          // 2. Not calling an auth endpoint (profile, validate, etc.)
          // 3. This is a real authentication failure (not a temporary cookie issue)
          if (!isAuthPage && !isAuthEndpoint) {
            // Check if user exists in localStorage - if yes, might be a cookie issue
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              // User exists in localStorage but cookie might be missing/expired
              // Try to refresh profile to get a new token
              console.warn('401 error but user exists in localStorage - attempting profile refresh');
              
              // Only attempt refresh if not already calling profile endpoint
              if (!endpoint.includes('/auth/profile')) {
                try {
                  const profileUrl = `${this.baseURL}/auth/profile`;
                  const profileResponse = await fetch(profileUrl, {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                  });
                  
                  if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    if (profileData.success && profileData.user) {
                      console.log('✅ Profile refresh successful - token may have been refreshed');
                      // Update user in localStorage
                      localStorage.setItem('user', JSON.stringify(profileData.user));
                      // Retry the original request
                      return this.request(endpoint, options);
                    }
                  }
                } catch (refreshError) {
                  console.error('Failed to refresh profile:', refreshError);
                }
              }
              
              // If refresh failed or not applicable, let the component handle it
              console.warn('401 error persists - cookie may be invalid or expired');
            } else {
              // No user in localStorage - clear everything and redirect
              console.log('401 error with no user in localStorage - clearing and redirecting');
              localStorage.removeItem('user');
              localStorage.removeItem('session_start');
              localStorage.removeItem('last_activity');
              window.location.href = '/login';
            }
          } else {
            // On auth page or calling auth endpoint - don't redirect
            console.log('401 on auth page/endpoint - not redirecting');
          }
        }

        // Handle 403 errors with user-friendly message
        if (response.status === 403) {
          const userFriendlyMessage = errorData.message === 'Insufficient permissions' 
            ? "You don't have permission to perform this action. Please contact an administrator."
            : errorData.message || 'Access denied';
          throw new Error(userFriendlyMessage);
        }

        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export default BaseApiService;
