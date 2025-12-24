import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { listPayments } from '../../services/paymentService';
import type { PaymentListFilters } from '../../types';

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
    const hasPermission =
      (await userHasPermission(userId, 'payment_management:view_payment')) ||
      (await userHasPermission(userId, 'payment_management:*'));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const paymentMethodId = searchParams.get('paymentMethodId') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const filters: PaymentListFilters = {
      search,
      paymentStatus: paymentStatus as any,
      paymentMethodId,
      dateFrom,
      dateTo,
    };

    const records = await listPayments(tenantId, filters);

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error('Payment list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

