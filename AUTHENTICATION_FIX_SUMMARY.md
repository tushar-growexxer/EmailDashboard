# Authentication & Session Management Fix

## Issues Resolved

### 1. **Critical: Cookie-Parser Missing**
**Problem**: Backend was trying to read `req.cookies.auth_token` but `cookie-parser` middleware was not installed or configured, causing all authenticated requests to fail with 401 errors.

**Solution**:
- Installed `cookie-parser` and `@types/cookie-parser` packages
- Added `import cookieParser from 'cookie-parser'` to `app.ts`
- Added `app.use(cookieParser())` middleware before routes

**Files Changed**:
- `email_dashboard-be/package.json` - Added dependencies
- `email_dashboard-be/src/app.ts` - Added cookie-parser middleware

### 2. **Critical: Session Expiring Immediately After Login**
**Problem**: `AuthContext` was checking for `lastActivity` timestamp BEFORE `sessionManager.init()` was called, causing newly logged-in users to be immediately logged out.

**Root Cause**: Race condition in initialization flow:
1. Get stored user from localStorage
2. Get lastActivity (null for fresh login)
3. If user exists but no lastActivity → clear session and logout
4. Call sessionManager.init() (too late!)

**Solution**:
- Reordered initialization to call `sessionManager.init()` FIRST
- Removed premature session expiry checks during initialization
- Let the background interval handle expiry checks naturally
- Backend validates tokens on each API call anyway

**Files Changed**:
- `email_dashboard-fe/src/contexts/AuthContext.jsx` - Fixed initialization order and login flow

## Changes Made

### Backend (`email_dashboard-be`)

#### `src/app.ts`
```typescript
import cookieParser from 'cookie-parser';

// ... other middleware ...

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies for authentication
```

### Frontend (`email_dashboard-fe`)

#### `src/contexts/AuthContext.jsx`

**Before** (initialization):
```javascript
const storedUser = authService.getUser();
const lastActivity = sessionManager.getLastActivity();

if (storedUser && !lastActivity) {
  // Clear session - BUG! This runs on every fresh login
  authService.clearLocalData();
  sessionManager.clearSession();
  return;
}

sessionManager.init({ ... }); // Too late!
```

**After** (initialization):
```javascript
const storedUser = authService.getUser();

// Initialize FIRST to set timestamps
sessionManager.init({
  onWarning: handleSessionWarning,
  onExpired: handleSessionExpired,
});

if (storedUser) {
  // Trust stored user, backend validates token
  setUser(storedUser);
}
```

**Before** (login):
```javascript
setUser(result.user);
sessionManager.clearSession(); // Clears timestamps
sessionManager.init({ ... }); // Re-initializes everything
```

**After** (login):
```javascript
setUser(result.user);
// Session manager already initialized, just update timestamps
sessionManager.updateLastActivity();
sessionManager.setSessionStart();
```

## Testing Checklist

- [x] Backend builds successfully with cookie-parser
- [ ] User can log in without immediate logout
- [ ] Users list fetches successfully on Settings page
- [ ] Session warnings appear at 5 minutes before expiry
- [ ] Session expires after 30 minutes of inactivity
- [ ] User activity extends session properly
- [ ] Logout clears session and cookies correctly

## How to Test

1. **Restart Backend Server**:
   ```bash
   cd email_dashboard-be
   pnpm dev
   ```

2. **Ensure Frontend is Running**:
   ```bash
   cd email_dashboard-fe
   npm run dev
   ```

3. **Test Login**:
   - Navigate to login page
   - Enter credentials
   - Should successfully log in and stay logged in
   - Check browser console - no "Session expired" errors

4. **Test User Fetching**:
   - Navigate to Settings page
   - Users list should load without 401 errors
   - Check Network tab - `/api/v1/users` should return 200

5. **Test Session Management**:
   - Stay logged in and idle
   - After 25 minutes, should see session warning
   - After 30 minutes, should be logged out
   - Any user activity should extend session

## Technical Notes

### Cookie-Based Authentication Flow

1. **Login**: Backend sets `auth_token` httpOnly cookie
2. **Requests**: Browser automatically sends cookie
3. **Backend**: `cookie-parser` middleware parses cookies
4. **Middleware**: `authenticateToken` reads `req.cookies.auth_token`
5. **Response**: Token validated, request proceeds

### Session Management Strategy

- **Backend**: 30-minute JWT expiry with auto-refresh on activity
- **Frontend**: Activity tracking with localStorage timestamps
- **Sync**: Both systems use 30-minute timeout
- **Extension**: Backend refreshes token after 5 minutes of use

### Why This Approach Works

1. **Security**: Tokens in httpOnly cookies (can't be accessed by JS)
2. **UX**: Activity-based sessions (activity extends session)
3. **Reliability**: Backend validates every request
4. **Simplicity**: Frontend only tracks activity, backend handles auth

## Related Files

- `email_dashboard-be/src/app.ts` - Cookie parser setup
- `email_dashboard-be/src/middlewares/auth.middleware.ts` - Token validation
- `email_dashboard-be/src/controllers/auth.controller.ts` - Login/logout
- `email_dashboard-fe/src/contexts/AuthContext.jsx` - Auth state management
- `email_dashboard-fe/src/lib/sessionManager.js` - Activity tracking
- `email_dashboard-fe/src/api/base.js` - API requests with credentials

