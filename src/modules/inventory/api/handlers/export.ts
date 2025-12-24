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

    const inventory = await listInventoryForTenant(tenantId, {});

    const headers = ['Product Name', 'SKU', 'Location', 'Quantity', 'Status', 'Price'];
    const rows = inventory.map((item) => [
      item.name,
      item.sku || '',
      item.location || '',
      item.quantity,
      item.status,
      item.price,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Inventory export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
