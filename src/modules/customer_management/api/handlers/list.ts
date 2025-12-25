import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { listCustomers } from '../../services/customerService';
import type { CustomerListFilters } from '../../types';

export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    let tenantId = await getUserTenantId(userId);

    // Check permission (super admin with admin:* has access to everything)
    const hasPermission = await userHasPermission(userId, 'customer_management:read') ||
      await userHasPermission(userId, 'customer_management:*') ||
      await userHasPermission(userId, 'admin:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // For super admin, allow tenantId from query params or use null to see all
    const { searchParams } = new URL(request.url);
    const tenantIdParam = searchParams.get('tenantId');
    
    if (!tenantId) {
      const { isUserSuperAdmin } = await import('@/core/lib/permissions');
      const isSuperAdmin = await isUserSuperAdmin(userId);
      if (isSuperAdmin) {
        // Super admin can specify tenantId in query params or see all
        tenantId = tenantIdParam || null;
      } else {
        return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
      }
    }

    const search = searchParams.get('search') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const hasOutstandingBalanceParam = searchParams.get('hasOutstandingBalance');

    const filters: CustomerListFilters = {
      search,
      isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
      hasOutstandingBalance: hasOutstandingBalanceParam === 'true' ? true : undefined,
    };

    // For super admin with null tenantId, we need to get all customers
    // For now, if tenantId is null, we'll need to handle it in listCustomers
    // But for simplicity, let's require a tenantId even for super admin (they can specify it)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required. Super admin can specify tenantId in query params.' }, { status: 400 });
    }

    const records = await listCustomers(tenantId, filters);

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error('Customer list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


