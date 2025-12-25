import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { updateOrder } from '../../services/orderService';
import { updateOrderSchema } from '../../schemas/ordersValidation';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json();

    // First, get the existing order to verify ownership
    const { getOrderById } = await import('../../services/orderService');
    const existingOrder = await getOrderById(params.id, tenantId);

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Ensure user can only update their own orders
    if (existingOrder.userId !== userId) {
      return NextResponse.json({ error: 'You can only update your own orders' }, { status: 403 });
    }

    const validation = updateOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 },
      );
    }

    // Ensure userId is set to current user (cannot be changed)
    const updateData = { ...validation.data, userId };

    try {
      const record = await updateOrder({
        id: params.id,
        tenantId,
        userId,
        data: updateData,
      });

      if (!record) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: record }, { status: 200 });
    } catch (error) {
      // If it's a validation error from the service, return it
      if (error instanceof Error && error.message.includes('Product not found')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Order update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

