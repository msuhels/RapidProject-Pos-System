import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listCartsForTenant } from '../../services/cartService';

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

    const carts = await listCartsForTenant(tenantId, {});

    const headers = ['Product Name', 'Product Price', 'Quantity', 'User ID'];
    const rows = carts.map((c) => [
      c.productName || c.productId,
      c.productPrice || '',
      c.quantity,
      c.userId,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="carts-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Cart export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

