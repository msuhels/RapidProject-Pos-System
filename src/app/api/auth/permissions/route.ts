import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserPermissions, getUserTenantId } from '@/core/lib/permissions';

/**
 * GET /api/auth/permissions
 * Get current user's permissions
 * Used by frontend usePermissions hook
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Get user's tenant
    const tenantId = await getUserTenantId(userId);
    
    // Get permissions
    const permissions = await getUserPermissions(userId, tenantId || undefined);
    
    return NextResponse.json(
      {
        success: true,
        permissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

