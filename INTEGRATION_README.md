# Email Dashboard - Frontend-Backend Integration

## Overview

This document describes the complete integration between the Email Dashboard frontend (React) and backend (Express + TypeScript) for authentication functionality.

## 🚀 What Was Implemented

### 1. API Service Layer (`src/lib/api.js`)
- **Purpose**: Centralized API communication with error handling
- **Features**:
  - Generic request handler with automatic token injection
  - Support for GET, POST, PUT, DELETE methods
  - Automatic error handling and response parsing
  - Configurable base URL with environment variable support

### 2. Authentication Service (`src/lib/auth.js`)
- **Purpose**: High-level authentication operations
- **Features**:
  - Login/logout functionality
  - User profile management
  - Token validation
  - Integration with token manager for secure storage

### 3. Token Management (`src/lib/tokenManager.js`)
- **Purpose**: Secure JWT token and user data storage
- **Features**:
  - localStorage-based token storage
  - User data persistence
  - Token expiration checking
  - JWT decoding utilities
  - Secure cleanup on logout

### 4. Authentication Context (`src/contexts/AuthContext.jsx`)
- **Purpose**: React context for global auth state management
- **Features**:
  - Global auth state (user, token, loading states)
  - Automatic token validation on app start
  - Login/logout methods
  - Profile refresh functionality

### 5. Updated Login Component (`src/pages/Login.jsx`)
- **Purpose**: Complete login UI with backend integration
- **Features**:
  - Real API integration (replaced mock login)
  - Comprehensive error handling
  - Success feedback with auto-redirect
  - Loading states and form validation
  - Responsive design with proper UX

### 6. Development Configuration
- **Vite Proxy Setup**: Configured for seamless API calls in development
- **Environment Variables**: Proper configuration for different environments
- **CORS Handling**: Proxy eliminates CORS issues during development

## 📁 File Structure

```
email_dashboard-fe/
├── src/
│   ├── lib/
│   │   ├── api.js              # API service layer
│   │   ├── auth.js             # Authentication service
│   │   └── tokenManager.js     # Token management utilities
│   ├── contexts/
│   │   └── AuthContext.jsx     # Authentication context
│   ├── pages/
│   │   └── Login.jsx           # Updated login component
│   └── main.jsx                # Updated with AuthProvider
├── .env                        # Environment configuration
└── vite.config.js              # Updated with proxy configuration
```

## 🔧 Configuration

### Environment Variables (`.env`)
```env
# Frontend Environment Variables
VITE_API_URL=/api/v1
NODE_ENV=development
```

### Backend Configuration
The backend should be running on `http://localhost:3000` with the following endpoints:
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile
- `GET /api/v1/auth/validate` - Validate JWT token

## 🚀 Getting Started

### 1. Start the Backend Server
```bash
cd email_dashboard-be
npm run dev
```

### 2. Start the Frontend Server
```bash
cd email_dashboard-fe
npm run dev
```

### 3. Test the Integration
```bash
node test-api-integration.js
```

### 4. Open the Application
Navigate to `http://localhost:5173` and try logging in.

## 🔐 Authentication Flow

1. **User submits login form** → `Login.jsx` calls `useAuth().login()`
2. **AuthContext** → Calls `authService.login()` with credentials
3. **AuthService** → Makes API call to `/api/v1/auth/login`
4. **API Service** → Handles request/response with error handling
5. **Token Manager** → Stores JWT token and user data securely
6. **Success** → Redirect to dashboard, auth state updated globally
7. **Failure** → Display user-friendly error message

## 🛠️ API Endpoints Used

### Login
```javascript
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response (Success):
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Logout
```javascript
POST /api/v1/auth/logout

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

### Profile
```javascript
GET /api/v1/auth/profile
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "user": { ... }
}
```

## 🔒 Security Features

- **JWT Token Storage**: Secure localStorage management
- **Automatic Token Validation**: Checks token validity on app start
- **Token Expiration Handling**: Utilities for checking token expiration
- **Secure Logout**: Complete cleanup of auth data
- **Error Handling**: Comprehensive error handling with user feedback

## 🧪 Testing

Run the integration test script to verify everything is working:

```bash
node test-api-integration.js
```

This script tests:
- Server connectivity
- Login endpoint (with invalid credentials)
- Logout endpoint
- Profile endpoint (without authentication)
- Token validation endpoint (without token)

## 🔧 Development Tips

1. **Environment Variables**: Use `.env` for configuration
2. **Proxy Configuration**: Vite proxy handles API calls seamlessly
3. **Error Handling**: Check browser console for detailed error messages
4. **Token Debugging**: Use browser dev tools to inspect stored tokens

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure Vite proxy is configured correctly
2. **Backend Not Running**: Ensure backend server is started on port 3000
3. **Invalid Credentials**: Check backend user data setup
4. **Token Issues**: Clear localStorage and try again

### Debug Steps

1. Check if backend is running: `curl http://localhost:3000/health`
2. Test login endpoint: `curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'`
3. Check browser console for frontend errors
4. Verify token storage in browser dev tools

## 📚 Next Steps

1. **Add Registration**: Implement user registration functionality
2. **Password Reset**: Add forgot password feature
3. **Route Protection**: Add authentication guards to protected routes
4. **Token Refresh**: Implement automatic token refresh before expiration
5. **User Management**: Add user profile editing capabilities

## 🎯 Production Considerations

1. **HTTPS**: Ensure secure connections in production
2. **Token Refresh**: Implement token refresh mechanism
3. **Environment Variables**: Use proper environment configuration
4. **Error Monitoring**: Add error tracking and logging
5. **Security Headers**: Implement proper security headers

---

**Note**: This integration provides a solid foundation for authentication in your Email Dashboard application with industry-standard practices for security, error handling, and user experience.
