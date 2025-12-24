import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listInventoryForTenant } from '../../services/inventoryService';

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
    const status = searchParams.get('status') || undefined;
    const location = searchParams.get('location') || undefined;
    const productId = searchParams.get('productId') || undefined;

    const records = await listInventoryForTenant(tenantId, {
      search,
      status,
      location,
      productId,
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Inventory list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
