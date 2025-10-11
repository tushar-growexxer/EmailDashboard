# Quick Testing Guide

## Prerequisites
1. Restart your backend server:
   ```bash
   cd email_dashboard-be
   pnpm dev
   ```

2. Ensure frontend is running:
   ```bash
   cd email_dashboard-fe
   npm run dev
   ```

---

## Test 1: Protected Routes (Logout Redirect)

### Steps:
1. **Login** with any user credentials
2. **Logout** using the logout button
3. Try to access: `http://localhost:5173/dashboard`
4. Try to access: `http://localhost:5173/settings`

### Expected Result:
✅ Both URLs should **immediately redirect** to `/login`
✅ You should NOT see the dashboard or settings page

---

## Test 2: Admin-Only Settings Visibility

### Steps:

**Test as Regular User:**
1. Login with a **regular user** account (role: "user")
2. Check the left sidebar navigation
3. Try accessing: `http://localhost:5173/settings`

### Expected Result:
✅ Settings link should **NOT appear** in sidebar
✅ Accessing `/settings` URL should redirect to `/dashboard`

**Test as Admin:**
1. Logout and login with an **admin** account (role: "admin")
2. Check the left sidebar navigation
3. Click on Settings in the sidebar

### Expected Result:
✅ Settings link **SHOULD appear** in sidebar
✅ Clicking Settings opens the Settings page successfully

---

## Test 3: Admin Password Reset

### Steps:

**As Admin:**
1. Login as **admin**
2. Navigate to **Settings** page
3. You should see a list of users
4. Find a user (not yourself) in the table
5. You should see **three icons**:
   - 👁️ Eye icon (View Profile)
   - 🔑 Blue Key icon (Reset Password) - **NEW!**
   - 🗑️ Red Trash icon (Delete User)

6. Click the **Blue Key icon** for any user
7. A modal should appear: "Reset Password"
8. Click **"Generate"** button to generate a password
9. Click **"Reset Password"**

### Expected Result:
✅ Blue key icon appears for all users except yourself
✅ Modal opens with user's name
✅ Generate button creates a random password
✅ Success message appears: "Password reset successfully for [User Name]!"
✅ Check backend logs - should show password reset action

**As Regular User:**
1. Logout and login as **regular user**
2. Settings page should not be accessible (redirects to dashboard)

### Expected Result:
✅ Regular users cannot access Settings at all
✅ Even if they try API directly, it will return 403 Forbidden

---

## Test 4: Session Management

### Steps:
1. Login successfully
2. Check browser console - should see:
   ```
   Session initialized with timestamp: [timestamp]
   Session start time set: [timestamp]
   ```
3. Use the application normally
4. Wait 5 minutes idle (or adjust `SESSION_TIMEOUT` for faster testing)

### Expected Result:
✅ After 25 minutes idle: Session warning appears
✅ After 30 minutes idle: Session expired dialog appears
✅ After clicking "Log In Again": Redirects to login
✅ User activity (clicks, scrolls) extends the session

---

## Test 5: Cookie Authentication

### Steps:
1. Login successfully
2. Open Browser DevTools → Application → Cookies
3. Check for cookie named: `auth_token`
4. Verify cookie properties:
   - HttpOnly: ✅ Yes
   - Secure: Depends on environment (production only)
   - SameSite: Strict
   - Max-Age: 1800 (30 minutes)

### Expected Result:
✅ Cookie exists and is httpOnly (can't be accessed by JavaScript)
✅ API requests automatically include this cookie
✅ Logout clears the cookie

---

## Test 6: User Data Fetching (Settings Page)

### Steps:
1. Login as **admin**
2. Navigate to **Settings** page
3. Check browser Network tab (DevTools)
4. Look for request: `GET /api/v1/users`

### Expected Result:
✅ Request returns **200 OK** (not 401 Unauthorized)
✅ Users list displays on the page
✅ No console errors

---

## Common Issues & Solutions

### Issue: Still getting 401 errors on `/users` endpoint
**Solution**: 
1. Check if backend server restarted after installing cookie-parser
2. Check browser console for cookie presence
3. Try hard refresh (Ctrl+Shift+R)

### Issue: Settings link shows for regular user
**Solution**:
1. Check user role in browser console: `localStorage.getItem('user')`
2. Should see role as "admin" or "user" (lowercase)
3. Clear localStorage and login again if role is wrong

### Issue: Session expires immediately
**Solution**:
1. Already fixed in AuthContext.jsx
2. Check browser console for "Session initialized" message
3. Should NOT see "Session expired" right after login

### Issue: Password reset button not visible
**Solution**:
1. Ensure you're logged in as admin
2. Ensure you're looking at OTHER users (not yourself)
3. Hard refresh the page

---

## Manual Testing Checklist

Copy and check off as you test:

### Protected Routes
- [ ] Logout redirects all protected routes to login
- [ ] `/dashboard` redirects when logged out
- [ ] `/settings` redirects when logged out
- [ ] Cannot access protected routes without authentication

### Admin Settings
- [ ] Admin user sees Settings in sidebar
- [ ] Regular user does NOT see Settings in sidebar
- [ ] Regular user redirected from `/settings` to `/dashboard`
- [ ] Admin can access Settings page successfully

### Password Reset
- [ ] Admin sees blue key icon for other users
- [ ] Admin does NOT see key icon for themselves
- [ ] Reset password modal opens correctly
- [ ] Generate password button works
- [ ] Password validation works (min 8 chars)
- [ ] Success message appears after reset
- [ ] Backend logs the password reset action

### Session Management
- [ ] Login successful without immediate logout
- [ ] Session data persists on page refresh
- [ ] User list loads successfully (no 401 errors)
- [ ] Cookies present and httpOnly
- [ ] Session warning at 5 min before expiry
- [ ] User activity extends session

---

## Debug Commands

### Check backend logs:
```bash
cd email_dashboard-be
tail -f logs/combined.log
```

### Check for errors:
```bash
tail -f logs/error.log
```

### Check user data in browser console:
```javascript
// Check stored user
JSON.parse(localStorage.getItem('user'))

// Check session data
localStorage.getItem('last_activity')
localStorage.getItem('session_start')
```

### Test API directly:
```bash
# Should return 401 without cookie
curl http://localhost:3000/api/v1/users

# After login, browser automatically sends cookie
```

---

## Success Criteria

All features working correctly when:
1. ✅ Logout prevents access to protected routes
2. ✅ Settings only visible/accessible to admin
3. ✅ Admin can reset other users' passwords
4. ✅ Regular users cannot reset passwords
5. ✅ No 401 errors when fetching users
6. ✅ Session management works without immediate logout
7. ✅ Cookie authentication functioning properly

---

## If Everything Works
🎉 **Congratulations!** All features are working correctly.

You can now:
- Use protected routes with confidence
- Manage users as admin
- Reset user passwords
- Enjoy stable authentication and session management

---

## If Something Doesn't Work
1. Check this guide for common issues
2. Review `FEATURE_IMPLEMENTATION_SUMMARY.md` for technical details
3. Check backend logs for errors
4. Ensure both frontend and backend are running
5. Try hard refresh and clear cache
6. Restart both servers

---

**Last Updated**: October 11, 2025
**Version**: 1.0.0

