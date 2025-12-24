import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users } from '@/core/lib/db/baseSchema';
import { verifyAuth } from '@/core/middleware/auth';
import { verifyPassword, hashPassword } from '@/core/lib/utils';
import { eq } from 'drizzle-orm';

/**
 * POST /api/auth/change-password
 * Change user password
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }
    
    // Get user with password hash
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userResult[0];
    
    // Check if user has a password (might be OAuth-only user)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Cannot change password for OAuth-only accounts' },
        { status: 400 }
      );
    }
    
    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    
    // Update password in database
    await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    console.log('[Change Password] Password changed successfully for user:', {
      userId: user.id,
      email: user.email,
    });
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Password changed successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

