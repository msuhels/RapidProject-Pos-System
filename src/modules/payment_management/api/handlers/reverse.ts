import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { reversePayment } from '../../services/paymentService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Check permission (admin only)
    const hasPermission =
      (await userHasPermission(userId, 'payment_management:reverse_payment')) ||
      (await userHasPermission(userId, 'payment_management:*'));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const payment = await reversePayment(params.id, tenantId, userId);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payment }, { status: 200 });
  } catch (error: any) {
    console.error('Payment reverse error:', error);
    if (error.message) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

