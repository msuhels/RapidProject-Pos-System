import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { createHash, randomBytes } from 'crypto';

/**
 * Hash password using SHA-256 (for production, use bcryptjs)
 * Note: Install bcryptjs for production: npm install bcryptjs @types/bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  // Using crypto for now - in production, prefer bcryptjs
  // For now, we'll use a simple approach that can be upgraded
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || !hash.includes(':')) {
    return false;
  }
  const [salt, storedHash] = hash.split(':');
  const computedHash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return computedHash === storedHash;
}

/**
 * Hash token for storage in database
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Format validation error details (commonly returned from zod) into a readable string.
 */
export function formatValidationDetails(details: unknown): string {
  if (!details) return '';

  if (typeof details === 'string') {
    return details;
  }

  if (Array.isArray(details)) {
    return details
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        if (typeof item === 'object') {
          const maybeError = item as Record<string, unknown>;
          const message = typeof maybeError.message === 'string' ? maybeError.message : '';
          const path = Array.isArray(maybeError.path) ? maybeError.path.join('.') : '';
          if (message && path) return `${path}: ${message}`;
          if (message) return message;
          if (path) return path;
          return '';
        }
        return String(item);
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof details === 'object') {
    return Object.values(details as Record<string, unknown>)
      .map((value) => (typeof value === 'string' ? value : ''))
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

/**
 * Build a human-friendly error message from an API error payload.
 * The base error is taken from `error`/`message` and appended with any formatted validation details.
 */
export function formatApiError(json: any, fallback = 'Request failed'): string {
  const base = (json && (json.error || json.message)) || fallback;
  const details = formatValidationDetails(json?.details);
  return details ? `${base}\n${details}` : base;
}

