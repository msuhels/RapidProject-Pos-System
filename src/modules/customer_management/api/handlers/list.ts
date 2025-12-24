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
    const tenantId = await getUserTenantId(userId);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
    }

    // Check permission
    const hasPermission = await userHasPermission(userId, 'customer_management:read') ||
      await userHasPermission(userId, 'customer_management:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const hasOutstandingBalanceParam = searchParams.get('hasOutstandingBalance');

    const filters: CustomerListFilters = {
      search,
      isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
      hasOutstandingBalance: hasOutstandingBalanceParam === 'true' ? true : undefined,
    };

    const records = await listCustomers(tenantId, filters);

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error('Customer list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


