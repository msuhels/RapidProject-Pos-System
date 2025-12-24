import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users } from '@/core/lib/db/baseSchema';
import { verifyAuth } from '@/core/middleware/auth';
import { getUserRole, getUserPermissionsWithModules } from '@/core/lib/permissions';
import { eq } from 'drizzle-orm';
import { validateRequest } from '@/core/middleware/validation';
import { updateUserSchema } from '@/core/lib/validations/users';

/**
 * Helper to load the current user's profile with role and permissions
 */
async function getCurrentUserProfile(userId: string) {
  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      isEmailVerified: users.isEmailVerified,
      tenantId: users.tenantId,
      phoneNumber: users.phoneNumber,
      jobTitle: users.jobTitle,
      department: users.department,
      companyName: users.companyName,
      dateOfBirth: users.dateOfBirth,
      bio: users.bio,
      addressLine1: users.addressLine1,
      addressLine2: users.addressLine2,
      city: users.city,
      state: users.state,
      postalCode: users.postalCode,
      country: users.country,
      timezone: users.timezone,
      locale: users.locale,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    return null;
  }

  const user = userResult[0];

  const role = await getUserRole(userId);
  const permissions = await getUserPermissionsWithModules(userId);

  return {
    ...user,
    role: role ? [role] : [],
    roles: role ? [role] : [],
    permissions,
  };
}

/**
 * GET /api/auth/profile
 * Get current user profile with roles and permissions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await getCurrentUserProfile(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/auth/profile
 * Update current user's own profile (safe fields only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Only allow self-service fields to be updated (email is read-only here)
    const allowedSchema = updateUserSchema.pick({
      fullName: true,
      timezone: true,
      locale: true,
      phoneNumber: true,
      jobTitle: true,
      department: true,
      companyName: true,
      dateOfBirth: true,
      bio: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    });

    const validation = validateRequest(allowedSchema, body);

    if (!validation.success) {
      console.error('Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Update the user
    const updateValues: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.fullName !== undefined) {
      updateValues.fullName = data.fullName?.trim() || null;
    }

    if (data.timezone !== undefined) {
      updateValues.timezone = data.timezone;
    }

    if (data.locale !== undefined) {
      updateValues.locale = data.locale;
    }

    if (data.phoneNumber !== undefined) {
      updateValues.phoneNumber = data.phoneNumber?.trim() || null;
    }

    if (data.jobTitle !== undefined) {
      updateValues.jobTitle = data.jobTitle?.trim() || null;
    }

    if (data.department !== undefined) {
      updateValues.department = data.department?.trim() || null;
    }

    if (data.companyName !== undefined) {
      updateValues.companyName = data.companyName?.trim() || null;
    }

    if (data.dateOfBirth !== undefined) {
      // PostgreSQL DATE columns expect a string in 'YYYY-MM-DD' format, not a Date object
      // Empty strings should be converted to null
      updateValues.dateOfBirth = data.dateOfBirth?.trim() || null;
    }

    if (data.bio !== undefined) {
      updateValues.bio = data.bio?.trim() || null;
    }

    if (data.addressLine1 !== undefined) {
      updateValues.addressLine1 = data.addressLine1?.trim() || null;
    }

    if (data.addressLine2 !== undefined) {
      updateValues.addressLine2 = data.addressLine2?.trim() || null;
    }

    if (data.city !== undefined) {
      updateValues.city = data.city?.trim() || null;
    }

    if (data.state !== undefined) {
      updateValues.state = data.state?.trim() || null;
    }

    if (data.postalCode !== undefined) {
      updateValues.postalCode = data.postalCode?.trim() || null;
    }

    if (data.country !== undefined) {
      updateValues.country = data.country?.trim() || null;
    }

    await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, userId));

    const user = await getCurrentUserProfile(userId);

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        // Include error details in development
        ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}
