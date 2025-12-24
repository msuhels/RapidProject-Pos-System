import jwt from 'jsonwebtoken';

// Secret key for signing tokens (should be in environment variables)
const SECRET_KEY = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface EmailVerificationPayload {
  email: string;
  purpose: 'email-verification';
}

/**
 * Generate an email verification JWT token
 * @param email - User's email address
 * @param expiryHours - Token expiry time in hours (default: 24 hours)
 * @returns JWT token string
 */
export function generateEmailVerificationToken(email: string, expiryHours: number = 24): string {
  const payload: EmailVerificationPayload = {
    email,
    purpose: 'email-verification',
  };
  
  // Generate JWT with expiry
  const token = jwt.sign(payload, SECRET_KEY, {
    expiresIn: `${expiryHours}h`,
    issuer: 'subzero-auth',
    audience: 'email-verification',
  });
  
  return token;
}

/**
 * Verify and decode an email verification JWT token
 * @param token - JWT token string
 * @returns Decoded payload with email if valid, null if invalid or expired
 */
export function verifyEmailVerificationToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, SECRET_KEY, {
      issuer: 'subzero-auth',
      audience: 'email-verification',
    }) as EmailVerificationPayload;
    
    // Verify purpose
    if (decoded.purpose !== 'email-verification') {
      console.error('[VerifyToken] Invalid token purpose');
      return null;
    }
    
    return { email: decoded.email };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('[VerifyToken] Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('[VerifyToken] Invalid token:', error.message);
    } else {
      console.error('[VerifyToken] Error verifying token:', error);
    }
    return null;
  }
}

/**
 * Decode token without verification (to check expiry or get email)
 * Use with caution - only for informational purposes
 */
export function decodeEmailVerificationToken(token: string): { email: string; exp: number } | null {
  try {
    const decoded = jwt.decode(token) as EmailVerificationPayload & { exp: number };
    
    if (!decoded || !decoded.email) {
      return null;
    }
    
    return {
      email: decoded.email,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

