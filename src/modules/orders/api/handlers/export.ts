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

    const orders = await listOrdersForTenant(tenantId, {});

    const headers = ['Order Date', 'User ID', 'Total Amount', 'Products Count', 'Created At'];
    const rows = orders.map((o) => [
      o.orderDate,
      o.userId,
      o.totalAmount || '0',
      o.products.length.toString(),
      o.createdAt,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Order export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

