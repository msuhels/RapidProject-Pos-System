import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listOrdersForTenant } from '../../services/orderService';

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const userIdFilter = searchParams.get('userId') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const records = await listOrdersForTenant(tenantId, {
      search,
      userId: userIdFilter,
      dateFrom,
      dateTo,
    }, userId);

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error('Order list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

