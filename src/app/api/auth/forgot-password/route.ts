import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users, passwordResetTokens } from '@/core/lib/db/baseSchema';
import { forgotPasswordSchema } from '@/core/lib/validations/auth';
import { validateRequest } from '@/core/middleware/validation';
import { generateToken } from '@/core/lib/utils';
import { sendPasswordResetEmail } from '@/core/lib/email';
import { eq, and, gt } from 'drizzle-orm';

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(forgotPasswordSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { email } = validation.data;
    
    // Find user by email
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (userResult.length === 0) {
      console.log(`[ForgotPassword] User not found for email: ${email}`);
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.',
        },
        { status: 200 }
      );
    }
    
    const user = userResult[0];
    
    // Check if user account is active
    if (user.status !== 'active' && user.status !== 'pending') {
      console.log(`[ForgotPassword] User account is not active: ${email}`);
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.',
        },
        { status: 200 }
      );
    }
    
    // Generate reset token
    const resetToken = generateToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    
    // Delete any existing unused reset tokens for this user
    await db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.usedAt, null as any)
        )
      );
    
    // Create new reset token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: resetToken,
      expiresAt,
      ipAddress: ipAddress.split(',')[0].trim(), // Take first IP if multiple
    });
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.fullName || undefined);
      console.log(`[ForgotPassword] Password reset email sent to: ${email}`);
    } catch (emailError) {
      console.error('[ForgotPassword] Failed to send email:', emailError);
      return NextResponse.json(
        {
          error: 'Failed to send password reset email. Please try again later.',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ForgotPassword] Error:', error);
    return NextResponse.json(
      {
        error: 'An error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

