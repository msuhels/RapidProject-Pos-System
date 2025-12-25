import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission, isUserSuperAdmin } from '@/core/lib/permissions';
import { recalculateAllCustomerTotals, recalculateCustomerTotalPurchases } from '../../services/customerService';

export async function POST(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    // Check permission (super admin with admin:* has access to everything)
    const hasPermission = await userHasPermission(userId, 'customer_management:update') ||
      await userHasPermission(userId, 'customer_management:*') ||
      await userHasPermission(userId, 'admin:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Handle empty body gracefully
    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is fine, use default
      body = {};
    }
    const { customerId } = body;

    // If customerId is provided, recalculate for that customer only
    if (customerId) {
      if (!tenantId) {
        const isSuperAdmin = await isUserSuperAdmin(userId);
        if (!isSuperAdmin) {
          return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
        }
        // For super admin, we need to get tenantId from customer
        const { getCustomerById } = await import('../../services/customerService');
        const customer = await getCustomerById(customerId, '');
        if (!customer) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        const total = await recalculateCustomerTotalPurchases(customerId, customer.tenantId);
        return NextResponse.json({ success: true, data: { customerId, totalPurchases: total } }, { status: 200 });
      }

      const total = await recalculateCustomerTotalPurchases(customerId, tenantId);
      return NextResponse.json({ success: true, data: { customerId, totalPurchases: total } }, { status: 200 });
    }

    // Recalculate for all customers
    if (!tenantId) {
      const isSuperAdmin = await isUserSuperAdmin(userId);
      if (!isSuperAdmin) {
        return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
      }
      // Super admin can recalculate all customers across all tenants
      return NextResponse.json({ error: 'Bulk recalculation for super admin not yet implemented. Please specify customerId.' }, { status: 400 });
    }

    const results = await recalculateAllCustomerTotals(tenantId, userId);
    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error) {
    console.error('Recalculate totals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

