import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { getCustomerSalesHistory } from '../../services/customerService';

export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    // Check permission (super admin with admin:* has access to everything)
    const hasPermission = await userHasPermission(userId, 'customer_management:read') ||
      await userHasPermission(userId, 'customer_management:*') ||
      await userHasPermission(userId, 'admin:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // For super admin, allow access even without tenant (pass null)
    // For other users, tenant is required
    let effectiveTenantId: string | null = tenantId;
    if (!tenantId) {
      const { isUserSuperAdmin } = await import('@/core/lib/permissions');
      const isSuperAdmin = await isUserSuperAdmin(userId);
      if (!isSuperAdmin) {
        return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
      }
      // Super admin can access any tenant's data
      effectiveTenantId = null;
    }

    const salesHistory = await getCustomerSalesHistory(customerId, effectiveTenantId);

    return NextResponse.json({ success: true, data: salesHistory }, { status: 200 });
  } catch (error) {
    console.error('Customer sales history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

