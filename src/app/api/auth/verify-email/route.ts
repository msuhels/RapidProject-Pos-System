import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users } from '@/core/lib/db/baseSchema';
import { verifyEmailVerificationToken } from '@/core/lib/verificationToken';
import { eq } from 'drizzle-orm';

/**
 * GET /api/auth/verify-email?token=xxx
 * Verify user's email address using JWT verification token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }
    
    // Verify JWT token and extract email
    const decoded = verifyEmailVerificationToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }
    
    const { email } = decoded;
    
    // Get the user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userResult[0];
    
    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email already verified. You can now log in.',
          alreadyVerified: true,
        },
        { status: 200 }
      );
    }
    
    // Update user: set email as verified and status as active
    await db
      .update(users)
      .set({
        isEmailVerified: true,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    console.log('[VerifyEmail] Email verified successfully for user:', user.email);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully! You can now log in.',
        user: {
          email: user.email,
          fullName: user.fullName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VerifyEmail] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

