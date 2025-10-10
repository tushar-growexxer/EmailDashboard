# Email Dashboard - Enhanced API Structure & Session Management

## Overview

This document describes the enhanced API structure and session management system implemented for the Email Dashboard application. The new architecture separates API concerns into organized modules and implements intelligent session management with automatic expiration.

## 🚀 New API Architecture

### Before vs After

**Before:** Single monolithic API file
```
src/lib/
└── api.js (300+ lines)
```

**After:** Organized modular structure
```
src/
├── api/
│   ├── index.js          # Main exports
│   ├── base.js           # Base API service
│   ├── auth.js           # Authentication APIs
│   └── dashboard.js      # Dashboard APIs
└── services/
    └── emailService.js   # Email-specific operations
```

### API Structure Benefits

1. **Separation of Concerns**: Each API module handles specific functionality
2. **Maintainability**: Easier to locate and modify specific API calls
3. **Reusability**: Services can be used across different components
4. **Type Safety**: Better organization for future TypeScript migration
5. **Testing**: Easier to mock and test individual API modules

## 📁 API Module Details

### Base API Service (`src/api/base.js`)
- **Purpose**: Core HTTP client with error handling
- **Features**:
  - Automatic JWT token injection
  - Consistent error handling
  - Request/response interceptors
  - Configurable base URL

### Authentication API (`src/api/auth.js`)
- **Purpose**: User authentication operations
- **Endpoints**:
  - `POST /auth/login` - User login
  - `POST /auth/logout` - User logout
  - `GET /auth/profile` - Get user profile
  - `GET /auth/validate` - Validate token

### Dashboard API (`src/api/dashboard.js`)
- **Purpose**: Dashboard and analytics data
- **Endpoints**:
  - `GET /dashboard/statistics` - Dashboard stats
  - `GET /dashboard/emails` - Recent emails
  - `GET /dashboard/analytics` - Email analytics
  - `PATCH /dashboard/emails/:id/read` - Toggle read status

### Email Service (`src/services/emailService.js`)
- **Purpose**: High-level email operations
- **Features**:
  - Email fetching with filtering
  - Read/unread status management
  - Email deletion
  - Future email composition

## 🔐 Session Management System

### 30-Minute Session Expiration

The system implements a comprehensive session management approach:

1. **JWT Token Expiration**: 30 minutes (configurable)
2. **Activity Tracking**: Monitors user interactions
3. **Session Warnings**: Alerts users before expiration
4. **Automatic Cleanup**: Removes expired sessions

### Session Management Components

#### Session Manager (`src/lib/sessionManager.js`)
```javascript
// Configuration
static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
static WARNING_TIME = 5 * 60 * 1000;     // Warning at 5 minutes
static ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

// Activity Events Monitored
static activityEvents = [
  'mousedown', 'mousemove', 'keypress',
  'scroll', 'touchstart', 'click'
];
```

#### Token Manager (`src/lib/tokenManager.js`)
- **Enhanced Storage**: Stores token with expiration metadata
- **Session Integration**: Checks both JWT and session expiration
- **Auto-cleanup**: Removes expired tokens automatically

#### Authentication Context (`src/contexts/AuthContext.jsx`)
- **Session Integration**: Initializes session tracking on login
- **Warning Handling**: Displays session warnings to users
- **Auto-logout**: Handles session expiration gracefully

## ⏰ Session Lifecycle

### 1. Login Process
```javascript
// User logs in → Token issued (30min expiry)
// Session tracking starts → Activity monitoring begins
// Last activity timestamp recorded
```

### 2. Active Session
```javascript
// User interacts → Activity timestamp updated
// Session extended → Warning reset
// Token remains valid
```

### 3. Inactivity Period (25+ minutes)
```javascript
// No activity detected → Session timer continues
// Warning not yet shown → User continues working
```

### 4. Warning Phase (5 minutes remaining)
```javascript
// Warning displayed → "Session expires in 5 minutes"
// User can extend → Session reset to 30 minutes
// Or dismiss → Warning hidden but timer continues
```

### 5. Session Expired
```javascript
// Session expires → User logged out automatically
// All auth data cleared → Redirect to login
// Warning: "Session expired. Please log in again."
```

## 🎯 Usage Examples

### Using API Services

```javascript
// Import specific API service
import { authApi, dashboardApi } from '../api';

// Authentication
const loginResult = await authApi.login({
  email: 'user@example.com',
  password: 'password'
});

// Dashboard data
const stats = await dashboardApi.getStatistics();
const emails = await dashboardApi.getRecentEmails(10);
```

### Using Email Service

```javascript
import { emailService } from '../services/emailService';

// Get emails with filtering
const result = await emailService.getEmails({
  limit: 20,
  filter: 'unread',
  search: 'important'
});

// Mark email as read
await emailService.toggleEmailRead(emailId, true);
```

### Session Management in Components

```javascript
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { sessionWarning, extendSession } = useAuth();

  const handleRefreshData = async () => {
    // API call automatically extends session
    await fetchDashboardData();
  };

  return (
    <div>
      {sessionWarning?.show && (
        <SessionWarning
          minutesLeft={sessionWarning.minutesLeft}
          onExtend={extendSession}
        />
      )}
      {/* Dashboard content */}
    </div>
  );
}
```

## ⚙️ Configuration

### Environment Variables

**Frontend** (`.env`):
```env
VITE_API_URL=/api/v1
NODE_ENV=development
```

**Backend** (`.env`):
```env
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=30m
```

### Session Configuration

```javascript
// src/lib/sessionManager.js
static SESSION_TIMEOUT = 30 * 60 * 1000;    // 30 minutes
static WARNING_TIME = 5 * 60 * 1000;        // Warning at 5 min
static ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
```

## 🔧 Development Workflow

### 1. Start Backend Server
```bash
cd email_dashboard-be
npm run dev  # Server starts on port 3000
```

### 2. Start Frontend Server
```bash
cd email_dashboard-fe
npm run dev  # Frontend starts on port 5173 with API proxy
```

### 3. Test Integration
```bash
node test-api-integration.js
```

### 4. Monitor Session Behavior
- Open browser dev tools → Application → Local Storage
- Monitor `last_activity` timestamp updates
- Check `auth_token` expiration data

## 🚨 Session Warning Component

The `SessionWarning` component appears when:
- Session has 5 minutes or less remaining
- User can extend session or dismiss warning
- Automatically disappears when session is extended

```jsx
<SessionWarning /> {/* Renders at app level */}
```

## 🔒 Security Enhancements

1. **Dual Expiration**: Both JWT tokens and session activity tracked
2. **Automatic Cleanup**: Expired sessions removed immediately
3. **Activity Monitoring**: Real-time user activity detection
4. **Graceful Degradation**: Users warned before forced logout
5. **Secure Storage**: Enhanced token storage with metadata

## 📊 Monitoring & Debugging

### Browser Dev Tools
- **Local Storage**: Check `last_activity`, `auth_token` data
- **Network Tab**: Monitor API calls and session extensions
- **Console**: Watch for session warning/expiration logs

### Debug Endpoints
```javascript
// Check session status
console.log(sessionManager.getTimeUntilExpiry());

// Check token status
console.log(tokenManager.getTokenExpirationTime(token));
```

## 🚨 Troubleshooting

### Common Issues

1. **Session Expires Too Quickly**
   - Check `SESSION_TIMEOUT` configuration
   - Verify activity events are being captured

2. **Warning Not Appearing**
   - Check `WARNING_TIME` setting
   - Verify warning callback is registered

3. **Token Storage Issues**
   - Check localStorage permissions
   - Verify token format and expiration

### Debug Steps

1. **Check Activity Monitoring**:
   ```javascript
   // Monitor activity in console
   sessionManager.updateLastActivity();
   console.log('Last activity:', sessionManager.getLastActivity());
   ```

2. **Test Session Expiration**:
   ```javascript
   // Manually trigger expiration check
   sessionManager.checkSession();
   ```

3. **Verify Token Handling**:
   ```javascript
   const token = tokenManager.getToken();
   console.log('Token valid:', !tokenManager.isTokenExpired(token));
   ```

## 🎯 Production Considerations

1. **HTTPS Only**: Ensure secure connections for session management
2. **Server-Side Validation**: Always verify sessions server-side
3. **Concurrent Sessions**: Handle multiple device logins
4. **Session Persistence**: Consider "Remember Me" functionality
5. **Analytics**: Track session duration and user behavior

## 📈 Future Enhancements

1. **Token Refresh**: Automatic token renewal before expiration
2. **Multi-tab Sync**: Synchronize session across browser tabs
3. **Device Management**: Track and manage user sessions
4. **Advanced Analytics**: Session usage patterns and optimization

---

This enhanced architecture provides a robust, scalable foundation for session management and API organization, ensuring excellent user experience and security.
