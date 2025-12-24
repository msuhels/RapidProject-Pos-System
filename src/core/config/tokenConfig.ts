/**
 * Token Configuration
 * Controls token expiration behavior
 */

/**
 * Set to true to make all tokens non-expiring
 * Useful for development or when you want persistent sessions
 * 
 * WARNING: In production, consider security implications of non-expiring tokens
 */
export const USE_NON_EXPIRING_TOKENS = process.env.NEXT_PUBLIC_NON_EXPIRING_TOKENS === 'true' || true;

/**
 * Token expiration settings
 */
export const TOKEN_CONFIG = {
  // Access token expiry in seconds (15 minutes)
  accessTokenExpiry: 60 * 15,
  
  // Refresh token expiry in seconds (7 days)
  refreshTokenExpiry: 60 * 60 * 24 * 7,
  
  // Whether tokens should never expire
  neverExpire: USE_NON_EXPIRING_TOKENS,
};

/**
 * Get token expiration behavior
 */
export function shouldTokensExpire(): boolean {
  return !USE_NON_EXPIRING_TOKENS;
}

