import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users } from '@/core/lib/db/baseSchema';
import { sendEmailVerificationEmail } from '@/core/lib/email';
import { generateEmailVerificationToken } from '@/core/lib/verificationToken';
import { eq } from 'drizzle-orm';

/**
 * POST /api/auth/resend-verification
 * Resend email verification link with JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find the user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    // Always return success to prevent email enumeration
    if (userResult.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, a verification link will be sent.',
        },
        { status: 200 }
      );
    }
    
    const user = userResult[0];
    
    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email is already verified. You can log in now.',
        },
        { status: 200 }
      );
    }
    
    // Generate new JWT verification token (no database storage needed)
    const verificationToken = generateEmailVerificationToken(user.email, 24); // 24 hours expiry
    
    // Send verification email
    try {
      await sendEmailVerificationEmail(user.email, verificationToken, user.fullName || undefined);
      console.log('[ResendVerification] Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('[ResendVerification] Failed to send verification email:', emailError);
      return NextResponse.json(
        {
          error: 'Failed to send verification email. Please try again later.',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent. Please check your inbox.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ResendVerification] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

