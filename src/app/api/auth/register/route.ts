import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users, authProviders, tenants } from '@/core/lib/db/baseSchema';
import { registerSchema } from '@/core/lib/validations/auth';
import { hashPassword } from '@/core/lib/utils';
import { validateRequest } from '@/core/middleware/validation';
import { isRegistrationEnabled } from '@/core/config/authConfig';
import { getDefaultUserRole } from '@/core/lib/roles';
import { sendEmailVerificationEmail } from '@/core/lib/email';
import { generateEmailVerificationToken } from '@/core/lib/verificationToken';
import { eq } from 'drizzle-orm';

/**
 * POST /api/auth/register
 * Registration endpoint with email, password, and name
 */
export async function POST(request: NextRequest) {
  // Check if registration is enabled
  if (!isRegistrationEnabled()) {
    return NextResponse.json(
      { error: 'Registration is currently disabled' },
      { status: 403 }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(registerSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { email, password, name } = validation.data;
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Get or create default tenant for self-registered users
    let defaultTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, 'default'))
      .limit(1);
    
    let tenantId: string;
    
    if (defaultTenant.length === 0) {
      // Create default tenant if it doesn't exist
      console.log('[Register] Creating default tenant for self-registered users');
      const newTenant = await db
        .insert(tenants)
        .values({
          name: 'Default Organization',
          slug: 'default',
          status: 'active',
          plan: 'free',
          maxUsers: 100,
          metadata: {},
        })
        .returning();
      tenantId = newTenant[0].id;
    } else {
      tenantId = defaultTenant[0].id;
    }
    
    // Get default "User" role for new registrations (system role with isDefault = true)
    const defaultRole = await getDefaultUserRole();
    
    if (!defaultRole) {
      console.error('[Register] Default "USER" role not found. Please run seed script.');
      return NextResponse.json(
        { error: 'System configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    console.log('[Register] Found default role:', defaultRole.code, '(', defaultRole.id, ')');
    
    // Create new user with 'pending' status until email is verified
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
        fullName: name || null,
        isEmailVerified: false,
        status: 'pending', // Will be changed to 'active' after email verification
        tenantId: tenantId,
        twoFactorEnabled: false,
        failedLoginAttempts: 0,
        timezone: 'UTC',
        locale: 'en',
        metadata: {},
      })
      .returning();
    
    const user = newUser[0];
    
    // Create auth provider entry for password authentication
    await db.insert(authProviders).values({
      userId: user.id,
      provider: 'password',
    });
    
    // Assign default role to user
    const { userRoles } = await import('@/core/lib/db/baseSchema');
    await db.insert(userRoles).values({
      userId: user.id,
      roleId: defaultRole.id,
      tenantId: tenantId,
      grantedBy: user.id, // Self-assigned
      isActive: true,
      metadata: {},
    });
    
    // Create customer record if user has "USER" role
    if (defaultRole.code === 'USER') {
      try {
        console.log('[Register] Creating customer record for user with USER role');
        const { createCustomer } = await import('@/modules/customer_management/services/customerService');
        await createCustomer({
          data: {
            name: name || email || 'Customer',
            email: email,
            isActive: true,
          },
          tenantId: tenantId,
          userId: user.id,
          linkedUserId: user.id,
        });
        console.log('[Register] Customer record created successfully');
      } catch (error) {
        console.error('[Register] Failed to create customer record:', error);
        // Don't fail registration if customer creation fails
      }
    }
    
    // Generate JWT email verification token (no database storage needed)
    const verificationToken = generateEmailVerificationToken(user.email, 24); // 24 hours expiry
    
    // Send verification email
    try {
      await sendEmailVerificationEmail(user.email, verificationToken, user.fullName || undefined);
      console.log('[Register] Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('[Register] Failed to send verification email:', emailError);
      // Don't fail registration if email fails - user can request resend
      console.warn('[Register] User created but verification email failed. User can request resend.');
    }
    
    // Return success response WITHOUT tokens - user must verify email first
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isEmailVerified: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
