# Auth Configuration Guide

The `auth.config.json` file controls authentication features and UI behavior in your application.

## Configuration File Location

`src/core/config/auth.config.json`

## Configuration Options

### Registration Settings

```json
{
  "registration": {
    "enabled": true,                    // Enable/disable registration feature
    "showOnLoginPage": true,            // Show register link on login page
    "requireEmailVerification": false,  // Require email verification (future feature)
    "allowPublicRegistration": true,    // Allow public user registration
    "minPasswordLength": 6,             // Minimum password length
    "requireStrongPassword": false       // Require strong password (future feature)
  }
}
```

**Key Settings:**
- `enabled: false` - Completely disables registration. Users cannot access `/register` route.
- `showOnLoginPage: false` - Hides the "Sign up" link on the login page (registration may still be accessible via direct URL if `enabled: true`)
- `allowPublicRegistration: false` - Disables public registration (useful for invite-only systems)

### Login Settings

```json
{
  "login": {
    "enabled": true,           // Enable/disable login feature
    "allowRememberMe": true,   // Show "Remember me" checkbox (future feature)
    "sessionDuration": 604800,  // Session duration in seconds (7 days)
    "maxLoginAttempts": 5,     // Maximum failed login attempts before lockout
    "lockoutDuration": 900     // Lockout duration in seconds (15 minutes)
  }
}
```

### Features

```json
{
  "features": {
    "passwordReset": true,        // Enable password reset functionality
    "emailVerification": false,   // Require email verification
    "twoFactorAuth": false,       // Enable 2FA (future feature)
    "socialLogin": false          // Enable social login (future feature)
  }
}
```

### UI Settings

```json
{
  "ui": {
    "showRegisterLink": true,           // Show register link in UI
    "showForgotPasswordLink": true,     // Show forgot password link
    "customBranding": {
      "enabled": false,                 // Enable custom branding
      "logo": null,                     // Path to custom logo
      "primaryColor": null              // Primary brand color
    }
  }
}
```

## Usage Examples

### Disable Registration Completely

```json
{
  "registration": {
    "enabled": false,
    "showOnLoginPage": false,
    "allowPublicRegistration": false
  },
  "ui": {
    "showRegisterLink": false
  }
}
```

### Invite-Only Registration

```json
{
  "registration": {
    "enabled": true,
    "showOnLoginPage": false,
    "allowPublicRegistration": false
  }
}
```

This allows registration via direct URL or API, but hides it from the login page.

### Hide Registration Link but Keep Feature

```json
{
  "registration": {
    "enabled": true,
    "showOnLoginPage": false
  },
  "ui": {
    "showRegisterLink": false
  }
}
```

## How It Works

1. **Server-Side**: Middleware and API routes check `isRegistrationEnabled()` to block access to `/register` if disabled.

2. **Client-Side**: Login page fetches config from `/api/auth/config` to conditionally show/hide the register link.

3. **API Protection**: The `/api/auth/register` endpoint checks the config before processing registration requests.

## Enterprise/SaaS Use Cases

### Multi-Tenant SaaS
- Different configs per tenant (requires runtime config loading)
- Tenant-specific registration rules

### B2B Application
- Disable public registration
- Enable invite-only registration
- Custom branding per client

### Internal Tools
- Disable registration completely
- Only allow admin-created accounts

## Future Enhancements

- Runtime config updates (without restart)
- Per-tenant configuration
- Feature flags integration
- A/B testing support

