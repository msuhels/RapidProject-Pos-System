// Auth configuration - Edge Runtime compatible
// This file works in both Edge Runtime (middleware) and Node.js Runtime (API routes)

import { authConfigData } from './authConfigData';

export interface AuthConfig {
  registration: {
    enabled: boolean;
    showOnLoginPage: boolean;
    requireEmailVerification: boolean;
    allowPublicRegistration: boolean;
    minPasswordLength: number;
    requireStrongPassword: boolean;
  };
  login: {
    enabled: boolean;
    allowRememberMe: boolean;
    sessionDuration: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  features: {
    passwordReset: boolean;
    emailVerification: boolean;
    twoFactorAuth: boolean;
    socialLogin: boolean;
  };
  ui: {
    showRegisterLink: boolean;
    showForgotPasswordLink: boolean;
    customBranding: {
      enabled: boolean;
      logo: string | null;
      primaryColor: string | null;
    };
  };
}

/**
 * Get auth configuration - Edge Runtime compatible
 * Uses TypeScript constant, so it's available at build time
 * 
 * To update config: Edit src/core/config/authConfigData.ts
 * The auth.config.json file is kept for reference/documentation
 */
export function getAuthConfig(): AuthConfig {
  // Use TypeScript constant (Edge Runtime compatible)
  // Environment variables can override specific settings
  const config = { ...authConfigData };
  
  // Allow environment variable overrides for critical settings
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.AUTH_REGISTRATION_ENABLED !== undefined) {
      config.registration.enabled = process.env.AUTH_REGISTRATION_ENABLED === 'true';
    }
    if (process.env.AUTH_ALLOW_PUBLIC_REGISTRATION !== undefined) {
      config.registration.allowPublicRegistration = process.env.AUTH_ALLOW_PUBLIC_REGISTRATION === 'true';
    }
  }
  
  return config;
}

/**
 * Check if registration is enabled
 * Edge Runtime compatible - can be used in middleware
 */
export function isRegistrationEnabled(): boolean {
  // Check environment variable first (for runtime overrides)
  const envEnabled = process.env.AUTH_REGISTRATION_ENABLED;
  if (envEnabled !== undefined) {
    return envEnabled === 'true';
  }

  const config = getAuthConfig();
  return config.registration.enabled && config.registration.allowPublicRegistration;
}

/**
 * Check if registration link should be shown on login page
 * Edge Runtime compatible
 */
export function shouldShowRegisterLink(): boolean {
  const config = getAuthConfig();
  return config.registration.enabled && config.ui.showRegisterLink && config.registration.showOnLoginPage;
}

/**
 * Get minimum password length from config
 * Edge Runtime compatible
 */
export function getMinPasswordLength(): number {
  const config = getAuthConfig();
  return config.registration.minPasswordLength;
}

