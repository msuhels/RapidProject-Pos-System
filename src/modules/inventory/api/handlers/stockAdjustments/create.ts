import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { createStockAdjustment } from '../../../services/stockAdjustmentService';
import { z } from 'zod';

const createStockAdjustmentSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  adjustmentType: z.enum(['increase', 'decrease'], {
    errorMap: () => ({ message: 'Adjustment type must be either increase or decrease' }),
  }),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  reason: z.string().min(1, 'Reason is required').max(100, 'Reason is too long'),
  notes: z.string().optional(),
});

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

    // Check permission
    const hasPermission =
      (await userHasPermission(userId, 'inventory:update')) ||
      (await userHasPermission(userId, 'inventory:*')) ||
      (await userHasPermission(userId, 'admin:*'));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createStockAdjustmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 },
      );
    }

    try {
      const record = await createStockAdjustment({
        data: validation.data,
        tenantId,
        userId,
      });

      return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Stock adjustment create error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

