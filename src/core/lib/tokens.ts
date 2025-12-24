import { db } from './db';
import { accessTokens, refreshTokens } from './db/baseSchema';
import { hashToken, generateToken } from './utils';
import { eq, and, gt } from 'drizzle-orm';

// Token expiration times (in seconds)
export const ACCESS_TOKEN_EXPIRY = 60 * 15; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days
export const NON_EXPIRING_TOKEN_DATE = new Date('2099-12-31'); // Far future date for non-expiring tokens

/**
 * Generate and store access token
 * @param userId - User ID
 * @param neverExpires - If true, token will not expire (useful for API keys, service accounts)
 */
export async function generateAccessToken(
  userId: string,
  neverExpires: boolean = false
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = neverExpires 
    ? NON_EXPIRING_TOKEN_DATE 
    : new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000);

  await db.insert(accessTokens).values({
    userId,
    tokenHash,
    expiresAt,
    revoked: false,
  });

  return { token, expiresAt };
}

/**
 * Generate and store refresh token
 * @param userId - User ID
 * @param neverExpires - If true, token will not expire (useful for API keys, service accounts)
 */
export async function generateRefreshToken(
  userId: string,
  neverExpires: boolean = false
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = neverExpires 
    ? NON_EXPIRING_TOKEN_DATE 
    : new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
    revoked: false,
  });

  return { token, expiresAt };
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);

  const result = await db
    .select({ userId: accessTokens.userId })
    .from(accessTokens)
    .where(
      and(
        eq(accessTokens.tokenHash, tokenHash),
        eq(accessTokens.revoked, false),
        gt(accessTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].userId;
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);

  const result = await db
    .select({ userId: refreshTokens.userId })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].userId;
}

/**
 * Revoke access token
 */
export async function revokeAccessToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db
    .update(accessTokens)
    .set({ revoked: true })
    .where(eq(accessTokens.tokenHash, tokenHash));
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

/**
 * Revoke all tokens for a user
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db
    .update(accessTokens)
    .set({ revoked: true })
    .where(eq(accessTokens.userId, userId));

  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.userId, userId));
}

