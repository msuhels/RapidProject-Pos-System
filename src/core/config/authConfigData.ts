// Auth configuration data - Edge Runtime compatible
// This file exports the config as a TypeScript constant
// 
// IMPORTANT: This file is used at runtime (including Edge Runtime/middleware)
// The auth.config.json file is for reference/documentation only
// 
// To update config: Edit this file directly
// Values here take precedence over auth.config.json

import type { AuthConfig } from './authConfig';

/**
 * Auth configuration data
 * This is the source of truth for runtime configuration
 * Edge Runtime compatible - no file system access needed
 */
export const authConfigData: AuthConfig = {
  registration: {
    enabled: true,
    showOnLoginPage: true,
    requireEmailVerification: false,
    allowPublicRegistration: true,
    minPasswordLength: 6,
    requireStrongPassword: false,
  },
  login: {
    enabled: true,
    allowRememberMe: true,
    sessionDuration: 604800, // 7 days
    maxLoginAttempts: 5,
    lockoutDuration: 900, // 15 minutes
  },
  features: {
    passwordReset: true,
    emailVerification: false,
    twoFactorAuth: false,
    socialLogin: false,
  },
  ui: {
    showRegisterLink: true,
    showForgotPasswordLink: true,
    customBranding: {
      enabled: false,
      logo: null,
      primaryColor: null,
    },
  },
};

