import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listProductsForTenant } from '../../services/productService';

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
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;

    const records = await listProductsForTenant(tenantId, { search, category, status });

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error('Product list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

