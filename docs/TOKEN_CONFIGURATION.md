# Token Configuration Guide

## Overview

The application now supports both expiring and non-expiring authentication tokens. This is useful for:
- **Development**: No need to re-login constantly
- **API Keys**: Create permanent access tokens for integrations
- **Service Accounts**: Long-running background processes
- **Testing**: Stable tokens for automated tests

## Configuration

### Environment Variable

Add to your `.env` or `.env.local` file:

```env
# Set to 'true' for non-expiring tokens
# Set to 'false' for standard expiration (15 min access, 7 days refresh)
NEXT_PUBLIC_NON_EXPIRING_TOKENS=true
```

### Default Behavior

**Current Setting**: Non-expiring tokens are **ENABLED by default**

The configuration is in `src/core/config/tokenConfig.ts`:

```typescript
export const USE_NON_EXPIRING_TOKENS = 
  process.env.NEXT_PUBLIC_NON_EXPIRING_TOKENS === 'true' || true;
```

## Token Expiration Settings

### Standard Expiration (when disabled)
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Behavior**: Users must refresh or re-login periodically

### Non-Expiring (when enabled)
- **Access Token**: Expires 2099-12-31
- **Refresh Token**: Expires 2099-12-31
- **Behavior**: Users stay logged in indefinitely (until manual logout or token revocation)

## Implementation Details

### Token Generation

The `generateAccessToken` and `generateRefreshToken` functions now accept a `neverExpires` parameter:

```typescript
// Generate non-expiring token
const { token, expiresAt } = await generateAccessToken(userId, true);

// Generate standard expiring token
const { token, expiresAt } = await generateAccessToken(userId, false);
```

### Automatic Application

The configuration is automatically applied in:
- ✅ **Login** (`/api/auth/login`)
- ✅ **Registration** (`/api/auth/register`)
- ✅ **Token Refresh** (if implemented)

### Token Verification

Token verification remains unchanged - it checks:
1. Token exists in database
2. Token is not revoked
3. Token has not expired (for non-expiring tokens, this check passes until 2099)

## Security Considerations

### Development vs Production

**Development** (Non-Expiring Tokens):
- ✅ Convenient - no constant re-login
- ✅ Faster development workflow
- ⚠️ Less secure if tokens are leaked

**Production** (Expiring Tokens):
- ✅ More secure - limited exposure window
- ✅ Automatic session timeout
- ⚠️ Users must re-authenticate periodically

### Best Practices

1. **Use expiring tokens in production**:
   ```env
   NEXT_PUBLIC_NON_EXPIRING_TOKENS=false
   ```

2. **Use non-expiring tokens in development**:
   ```env
   NEXT_PUBLIC_NON_EXPIRING_TOKENS=true
   ```

3. **For API keys**: Create separate non-expiring tokens for service accounts

4. **Token Revocation**: Always implement manual token revocation for security

5. **HTTPS Only**: Always use HTTPS in production to protect tokens

## Token Revocation

Even with non-expiring tokens, you can manually revoke them:

```typescript
import { revokeAccessToken, revokeRefreshToken, revokeAllUserTokens } from '@/core/lib/tokens';

// Revoke specific token
await revokeAccessToken(token);

// Revoke all tokens for a user (force logout everywhere)
await revokeAllUserTokens(userId);
```

## Checking Token Status

You can check if tokens are configured to expire:

```typescript
import { shouldTokensExpire, TOKEN_CONFIG } from '@/core/config/tokenConfig';

if (shouldTokensExpire()) {
  console.log('Tokens will expire after:', TOKEN_CONFIG.accessTokenExpiry, 'seconds');
} else {
  console.log('Tokens are configured to never expire');
}
```

## Migration Guide

### Switching from Expiring to Non-Expiring

1. Update environment variable:
   ```env
   NEXT_PUBLIC_NON_EXPIRING_TOKENS=true
   ```

2. Restart your application

3. **Existing tokens**: Will continue with their original expiration
4. **New tokens**: Will be non-expiring

### Switching from Non-Expiring to Expiring

1. Update environment variable:
   ```env
   NEXT_PUBLIC_NON_EXPIRING_TOKENS=false
   ```

2. Restart your application

3. **Existing non-expiring tokens**: Will remain valid until 2099
4. **New tokens**: Will expire after standard duration

5. **Optional**: Revoke all existing tokens to force re-authentication:
   ```sql
   UPDATE access_tokens SET revoked = true;
   UPDATE refresh_tokens SET revoked = true;
   ```

## Troubleshooting

### Tokens still expiring after enabling non-expiring

**Solution**: 
1. Check environment variable is set correctly
2. Restart the development server
3. Clear existing tokens and login again
4. Check server logs for token generation messages

### Users getting logged out unexpectedly

**Possible causes**:
1. Token was manually revoked
2. Database connection issue
3. Token not found in database
4. Environment variable not loaded

**Solution**:
1. Check database for token existence
2. Verify `NEXT_PUBLIC_NON_EXPIRING_TOKENS` is set
3. Check server logs for authentication errors

### How to verify token expiration date

Check the database:

```sql
SELECT 
  user_id, 
  expires_at, 
  revoked,
  created_at
FROM access_tokens 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 5;
```

Non-expiring tokens will show `expires_at: 2099-12-31`.

## API Response

When logging in, the response includes token expiration info:

```json
{
  "success": true,
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "...",
  "expiresAt": "2099-12-31T00:00:00.000Z"  // Non-expiring
}
```

## Related Files

- `/src/core/lib/tokens.ts` - Token generation and verification
- `/src/core/config/tokenConfig.ts` - Configuration settings
- `/src/app/api/auth/login/route.ts` - Login endpoint
- `/src/app/api/auth/register/route.ts` - Registration endpoint
- `/src/core/middleware/auth.ts` - Authentication middleware

## Summary

✅ Non-expiring tokens are now **enabled by default**
✅ Tokens expire on **2099-12-31** (effectively never)
✅ Can be toggled via environment variable
✅ Applies to both login and registration
✅ Tokens can still be manually revoked for security
✅ Suitable for development and API keys
⚠️ Consider using expiring tokens in production

