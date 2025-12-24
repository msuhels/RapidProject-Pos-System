# Login Redirect Issue - Troubleshooting Guide

## Problem
After successful login, the app shows "Login successful" but doesn't redirect to `/dashboard`. The browser stays on `/login` page.

## Root Causes & Solutions

### 1. **Cookie Not Being Set/Sent (MOST LIKELY IN DOCKER)**

#### Issue
When `NODE_ENV=production` in Docker:
- `secure: true` flag is set on cookies
- Browsers will only send cookies over HTTPS
- If Docker is accessed via HTTP, cookies are rejected by browser

#### Solution Applied ✅
```typescript
// src/app/api/auth/login/route.ts & register/route.ts
const isSecureConnection = request.headers.get('x-forwarded-proto') === 'https' 
  || request.nextUrl.protocol === 'https:'
  || process.env.NODE_ENV === 'development';

response.cookies.set('access-token', accessToken, {
  httpOnly: true,
  secure: isSecureConnection,  // Now checks actual connection, not just NODE_ENV
  sameSite: isSecureConnection ? 'strict' : 'lax',
  path: '/',
  maxAge: cookieMaxAge,
});
```

**For Docker/Production:**
Ensure your proxy (nginx, traefik, etc.) sets the `X-Forwarded-Proto: https` header if using HTTPS.

### 2. **Middleware Not Reading Cookie**

#### Issue
The middleware checks for `access-token` cookie, but it's not being read.

#### Debug
The proxy now logs detailed information:
```
[Proxy] Route Access: {
  pathname: "/dashboard",
  hasToken: true/false,
  cookieNames: ["access-token", "refresh-token"]
}
```

Check browser console logs to see if token is present.

### 3. **Race Condition (FIXED)**

#### Issue
Old implementation had a delay before redirecting, but it was inconsistent.

#### Solution
Removed the artificial delay. The real issue is the cookie security flag, not timing.

---

## Debugging Steps

### Step 1: Check Browser Cookies
1. Open DevTools (F12)
2. Go to **Application** → **Cookies**
3. Look for `access-token` cookie
4. Check its properties:
   - ✅ Should exist after login
   - ✅ `Domain` should match your domain
   - ✅ `Path` should be `/`
   - ✅ `HttpOnly` should be checked
   - ✅ `Secure` flag - depends on protocol (HTTP vs HTTPS)
   - ✅ `SameSite` should be `Lax` or `Strict`

### Step 2: Check Network Requests
1. Open DevTools → **Network** tab
2. Login
3. Look for `/api/auth/login` request
4. Check **Response Headers**:
   ```
   set-cookie: access-token=...; Path=/; HttpOnly; SameSite=Lax; Max-Age=900
   ```
5. If `set-cookie` header is missing or malformed, that's the issue

### Step 3: Check Server Logs
Look for logs like:
```
[Login] Tokens generated: { userId: "...", email: "...", nonExpiring: false }
[Login] Cookie Configuration: { isSecureConnection: true/false, ... }
[Proxy] Route Access: { pathname: "/dashboard", hasToken: true/false, ... }
```

### Step 4: Check Middleware
The proxy logs show if:
- ✅ Token is found in cookies
- ✅ Route is protected
- ✅ Redirect is happening

---

## Common Docker Issues

### Issue: "Running on HTTP but cookies have Secure flag"
**Symptom:** Login works, cookie appears in response, but not sent in subsequent requests

**Fix:** 
1. Ensure proxy sets `X-Forwarded-Proto: https` header
2. Or run Docker over HTTPS
3. Check docker-compose configuration:
```yaml
services:
  app:
    environment:
      - NODE_ENV=production
    # If behind reverse proxy that handles HTTPS:
    # Proxy should set X-Forwarded-Proto header
```

### Issue: "Cookie works locally but not in Docker"
**Cause:** CORS or cookie domain mismatch

**Check:**
1. Browser is accessing same domain
2. No cross-domain requests (subdomain changes between API and frontend)
3. Cookie domain is not overly restricted

### Issue: "Cookies set in login but gone after redirect"
**Cause:** Cookie domain or path mismatch

**Fix:**
- Verify all endpoints set cookies with `path: '/'`
- Check that frontend and API are on same domain
- If using API on different domain, enable CORS with `credentials: include`

---

## Testing Locally

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:3000
# 3. Login with: admin@example.com / admin123
# 4. Check DevTools cookies
# 5. Should redirect to /dashboard automatically
```

**Expected behavior:**
- Login form submitted
- API request to `/api/auth/login`
- Response includes `Set-Cookie` headers
- Cookies appear in DevTools
- Page redirects to `/dashboard`

---

## Testing in Docker

```bash
# 1. Build image
docker build -t subzero-app .

# 2. Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXT_PUBLIC_API_URL="http://localhost:3000" \
  subzero-app

# 3. Open http://localhost:3000
# 4. Login and check:
#    - DevTools cookies
#    - Network tab for set-cookie headers
#    - Server logs for [Login] and [Proxy] messages
```

---

## Console Debug Command

Run this in browser console to check auth state:
```javascript
// Check if auth store is hydrated and has user
const authStore = window.__ZUSTAND_DEBUG_STORE__;
if (authStore) {
  console.log('Auth Store:', authStore.getState());
}
```

---

## Next Steps If Still Not Working

1. **Check all console logs** - Look for errors in:
   - Browser console
   - Docker container logs
   - Network tab errors

2. **Verify database** - Ensure user exists in database:
   ```sql
   SELECT id, email FROM users WHERE email = 'admin@example.com';
   ```

3. **Check token generation** - Verify tokens are being generated:
   - Look for `[Login] Tokens generated:` in logs

4. **Test with curl**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"admin123"}' \
     -v  # Shows response headers including Set-Cookie
   ```

---

## Files Modified

- `src/app/api/auth/login/route.ts` - Fixed cookie security handling
- `src/app/api/auth/register/route.ts` - Fixed cookie security handling  
- `src/app/(auth)/login/page.tsx` - Added logging
- `src/proxy.ts` - Added detailed debugging logs

All changes maintain backward compatibility while improving debugging capability.
