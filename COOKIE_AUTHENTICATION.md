# Email Dashboard - Cookie-Based Authentication & Security Enhancement

## Overview

This document describes the enhanced security implementation using httpOnly cookies for authentication instead of localStorage. This approach provides superior security while maintaining excellent user experience.

## 🔒 Security Enhancement: httpOnly Cookies

### Why Cookies Instead of localStorage?

**Security Concerns with localStorage:**
- Accessible via JavaScript (XSS vulnerability)
- Visible in browser dev tools
- Can be stolen via malicious scripts
- No automatic expiration handling
- Sent with every request (even unnecessary ones)

**Benefits of httpOnly Cookies:**
- ✅ **Server-side only access** - Immune to XSS attacks
- ✅ **Automatic expiration** - No manual cleanup needed
- ✅ **Secure transmission** - Only sent over HTTPS in production
- ✅ **CSRF protection** - SameSite attribute prevents CSRF
- ✅ **Automatic inclusion** - Sent only with relevant requests

## 🏗️ Architecture Changes

### Backend Changes

#### Updated Auth Controller (`src/controllers/auth.controller.ts`)
```typescript
// Set httpOnly cookie with token
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 60 * 1000, // 30 minutes
  path: '/',
};

res.cookie('auth_token', token, cookieOptions);
```

#### Updated Auth Middleware (`src/middlewares/auth.middleware.ts`)
```typescript
// Read token from cookie instead of Authorization header
const token = req.cookies?.auth_token;
```

#### Updated Logout (`src/controllers/auth.controller.ts`)
```typescript
// Clear the auth cookie
res.clearCookie('auth_token', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
});
```

### Frontend Changes

#### Updated API Service (`src/api/base.js`)
```javascript
const config = {
  credentials: 'include', // Include cookies in request
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
  ...options,
};
```

#### Updated Token Manager (`src/lib/tokenManager.js`)
```javascript
// No direct token access - tokens are in httpOnly cookies
static setToken(token) {
  // Tokens are now handled server-side only
}

static getToken() {
  // Cannot access httpOnly cookies from JavaScript
  return null;
}
```

#### Updated Auth Service (`src/lib/auth.js`)
```javascript
// Login stores user data locally, tokens in cookies
async login(email, password) {
  const response = await authApi.login({ email, password });

  if (response.success) {
    tokenManager.setUser(response.user);
    tokenManager.setSessionStart();
    return { success: true, user: response.user };
  }
}
```

## 🍪 Cookie Configuration

### Production Security Settings

```javascript
const cookieOptions = {
  httpOnly: true,           // Prevents XSS access
  secure: true,             // HTTPS only
  sameSite: 'strict',       // CSRF protection
  maxAge: 30 * 60 * 1000,   // 30 minutes
  path: '/',                // Available site-wide
};
```

### Development Settings

```javascript
const cookieOptions = {
  httpOnly: true,
  secure: false,            // Allow HTTP in development
  sameSite: 'lax',          // More permissive for dev
  maxAge: 30 * 60 * 1000,
  path: '/',
};
```

## 🔄 Authentication Flow

### Before (localStorage)
```
1. User Login → Token stored in localStorage
2. API Calls → Manual Authorization header injection
3. Token Access → Direct JavaScript access (vulnerable)
4. Logout → Manual localStorage cleanup
```

### After (httpOnly Cookies)
```
1. User Login → Token stored in httpOnly cookie
2. API Calls → Automatic cookie inclusion by browser
3. Token Access → Server-side only (secure)
4. Logout → Server clears cookie automatically
```

## 📊 Session Management

### Activity Tracking
Since tokens are not accessible client-side, session management relies on:

1. **User Activity Monitoring**: Mouse, keyboard, touch, scroll events
2. **Session Start Tracking**: Timestamp when user logged in
3. **Warning System**: Alerts user before session expires
4. **API-based Validation**: Server validates authentication status

### Session Lifecycle

```javascript
// Login → Session starts
tokenManager.setSessionStart(); // Records login time

// Activity extends session
sessionManager.handleActivity(); // Updates last activity

// Warning appears at 25 minutes
sessionManager.handleSessionWarning(); // Shows 5-min warning

// Session expires at 30 minutes
sessionManager.handleSessionExpired(); // Auto-logout
```

## 🛠️ Implementation Details

### API Service Updates

**All API requests now include:**
```javascript
{
  credentials: 'include',  // Sends cookies with requests
  // Automatic cookie handling by browser
}
```

**Authentication validation:**
```javascript
// Check auth status via API call
const response = await authApi.validateToken();

// Server validates cookie and returns user data
if (response.success) {
  tokenManager.setUser(response.user);
}
```

### Error Handling

**401 Responses trigger automatic cleanup:**
```javascript
// In API service
if (response.status === 401) {
  localStorage.removeItem('user');
  localStorage.removeItem('session_start');
}
```

### Session Warnings

**SessionWarning Component** appears when:
- 5 minutes remain in session
- User can extend session or dismiss warning
- Automatic logout if no action taken

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=30m
```

**Frontend** (`.env`):
```env
VITE_API_URL=/api/v1
NODE_ENV=development
```

### Cookie Settings by Environment

| Setting | Development | Production |
|---------|-------------|------------|
| httpOnly | ✅ | ✅ |
| secure | ❌ | ✅ |
| sameSite | lax | strict |
| maxAge | 30 minutes | 30 minutes |

## 🚨 Security Benefits

### 1. XSS Protection
```javascript
// Before: Vulnerable to XSS
const token = localStorage.getItem('auth_token');
maliciousScript.innerHTML = token; // Can steal token

// After: Immune to XSS
// httpOnly cookies cannot be accessed via JavaScript
// maliciousScript cannot read token
```

### 2. CSRF Protection
```javascript
// sameSite: 'strict' prevents CSRF attacks
// Cookies only sent with first-party requests
```

### 3. Automatic Expiration
```javascript
// Cookies expire automatically after maxAge
// No manual cleanup needed
// Browser handles expiration transparently
```

### 4. Secure Transmission
```javascript
// secure: true ensures HTTPS-only transmission
// Tokens never sent over unencrypted connections
```

## 📈 Usage Examples

### Login Process
```javascript
// Frontend sends credentials
const result = await authService.login(email, password);

// Backend sets httpOnly cookie and returns user data
// Frontend stores user data in localStorage
if (result.success) {
  // User data stored locally, token in secure cookie
  console.log('Logged in as:', result.user.email);
}
```

### API Requests
```javascript
// Cookies automatically included in requests
const emails = await dashboardApi.getRecentEmails();

// Browser sends:
// Cookie: auth_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Logout Process
```javascript
// Frontend calls logout endpoint
await authService.logout();

// Backend clears cookie
// Frontend clears localStorage
```

## 🔍 Debugging & Monitoring

### Browser Dev Tools
- **Application → Cookies**: View cookie settings (not values)
- **Network → Headers**: See if cookies are being sent
- **Console**: Monitor session warning/expiration logs

### Debug Commands
```javascript
// Check session status
console.log('Session expires in:', sessionManager.getTimeUntilExpiry());

// Check user data
console.log('Current user:', tokenManager.getUser());

// Monitor activity
sessionManager.updateLastActivity();
```

## ⚠️ Important Notes

### 1. Token Access
```javascript
// ❌ This will not work with httpOnly cookies
const token = tokenManager.getToken(); // Returns null

// ✅ Use API calls for authentication validation
const validation = await authService.validateAuth();
```

### 2. Session Persistence
```javascript
// Sessions persist across browser refreshes
// But expire after 30 minutes of inactivity
// Users must re-authenticate after expiration
```

### 3. Multiple Tabs
```javascript
// Session shared across tabs via cookies
// Activity in one tab extends session for all tabs
// Logout in one tab logs out all tabs
```

## 🚀 Deployment Considerations

### HTTPS Requirement
```javascript
// Production must use HTTPS
// secure: true requires HTTPS
// HTTP will not work in production
```

### Load Balancer Configuration
```javascript
// Ensure cookies are preserved across load balancer
// Sticky sessions may be required for stateful cookies
```

### CDN Considerations
```javascript
// Cookies work with CDNs
// Ensure proper cookie domain configuration
```

## 🔮 Future Enhancements

### 1. Token Refresh
```javascript
// Implement automatic token refresh before expiration
// Use refresh tokens in separate httpOnly cookie
// Extend session without user interaction
```

### 2. Remember Me
```javascript
// Long-term cookies for "Remember Me" functionality
// Separate short-term and long-term cookies
// Balance security with convenience
```

### 3. Multi-device Sessions
```javascript
// Track sessions across multiple devices
// Session management dashboard for users
// Revoke sessions from specific devices
```

## 📋 Migration Guide

### From localStorage to Cookies

1. **Update Backend**
   - Modify auth controller to set cookies
   - Update middleware to read from cookies
   - Set appropriate cookie security flags

2. **Update Frontend**
   - Remove direct token access
   - Update API service to include credentials
   - Modify auth service for cookie-based flow
   - Update session management for activity tracking

3. **Test Thoroughly**
   - Verify login/logout works correctly
   - Test session expiration behavior
   - Ensure API calls work with cookies
   - Check security headers and settings

---

This cookie-based authentication system provides enterprise-grade security while maintaining excellent user experience. The httpOnly cookies eliminate XSS vulnerabilities, and the comprehensive session management ensures proper timeout handling.
