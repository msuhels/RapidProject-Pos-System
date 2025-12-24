import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users, passwordResetTokens } from '@/core/lib/db/baseSchema';
import { resetPasswordSchema } from '@/core/lib/validations/auth';
import { validateRequest } from '@/core/middleware/validation';
import { hashPassword } from '@/core/lib/utils';
import { eq, and, gt, isNull } from 'drizzle-orm';

/**
 * POST /api/auth/reset-password
 * Reset password using token from email
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(resetPasswordSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { token, password } = validation.data;
    
    // Find valid reset token
    const tokenResult = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
        usedAt: passwordResetTokens.usedAt,
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    
    if (tokenResult.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }
    
    const resetToken = tokenResult[0];
    
    // Check if token has already been used
    if (resetToken.usedAt) {
      return NextResponse.json(
        {
          error: 'This reset link has already been used',
        },
        { status: 400 }
      );
    }
    
    // Check if token has expired
    if (new Date() > new Date(resetToken.expiresAt)) {
      return NextResponse.json(
        {
          error: 'This reset link has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }
    
    // Get user
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, resetToken.userId))
      .limit(1);
    
    if (userResult.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
        },
        { status: 404 }
      );
    }
    
    const user = userResult[0];
    
    // Check if user account is active or pending
    if (user.status !== 'active' && user.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Account is not active',
        },
        { status: 403 }
      );
    }
    
    // Hash new password
    const passwordHash = await hashPassword(password);
    
    // Update user password and reset failed login attempts
    await db
      .update(users)
      .set({
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetTokens.id, resetToken.id));
    
    console.log(`[ResetPassword] Password successfully reset for user: ${user.email}`);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ResetPassword] Error:', error);
    return NextResponse.json(
      {
        error: 'An error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Verify if a reset token is valid (for frontend validation)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Token is required',
        },
        { status: 400 }
      );
    }
    
    // Find token
    const tokenResult = await db
      .select({
        id: passwordResetTokens.id,
        expiresAt: passwordResetTokens.expiresAt,
        usedAt: passwordResetTokens.usedAt,
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    
    if (tokenResult.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid token',
        },
        { status: 200 }
      );
    }
    
    const resetToken = tokenResult[0];
    
    // Check if token has been used
    if (resetToken.usedAt) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Token has already been used',
        },
        { status: 200 }
      );
    }
    
    // Check if token has expired
    if (new Date() > new Date(resetToken.expiresAt)) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Token has expired',
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      {
        valid: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ResetPassword] Verification error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

