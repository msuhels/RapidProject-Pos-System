import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { createOrder } from '../../services/orderService';
import { createOrderSchema } from '../../schemas/ordersValidation';

export async function POST(request: NextRequest) {
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
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 },
      );
    }

    // Ensure userId is set to current user if not provided
    const orderData = { ...validation.data, userId: validation.data.userId || userId };

    try {
      const record = await createOrder({
        data: orderData,
        tenantId,
        userId,
      });

      return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch (error) {
      // If it's a validation error from the service, return it
      if (error instanceof Error) {
        if (
          error.message.includes('Insufficient stock') ||
          error.message.includes('Product not found')
        ) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Order create error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

