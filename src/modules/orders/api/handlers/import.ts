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
    const { orders: ordersData } = body;

    if (!Array.isArray(ordersData)) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < ordersData.length; i++) {
      const orderData = ordersData[i];
      const validation = createOrderSchema.safeParse(orderData);

      if (!validation.success) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${validation.error.errors.map((e) => e.message).join(', ')}`);
        continue;
      }

      try {
        // Ensure userId is set to current user if not provided
        const orderDataWithUserId = { ...validation.data, userId: validation.data.userId || userId };
        await createOrder({
          data: orderDataWithUserId,
          tenantId,
          userId,
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          total: ordersData.length,
          success: results.success,
          failed: results.failed,
          errors: results.errors,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Order import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

