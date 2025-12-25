import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { listStockMovements } from '../../services/stockMovementService';
import { z } from 'zod';

const listStockMovementsQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  movementType: z.enum(['increase', 'decrease', 'adjustment']).optional(),
  reason: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

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
      (await userHasPermission(userId, 'inventory:read')) ||
      (await userHasPermission(userId, 'inventory:*')) ||
      (await userHasPermission(userId, 'admin:*'));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      productId: searchParams.get('productId') || undefined,
      movementType: searchParams.get('movementType') as 'increase' | 'decrease' | 'adjustment' | undefined,
      reason: searchParams.get('reason') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    };

    const validation = listStockMovementsQuerySchema.safeParse(filters);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 },
      );
    }

    const movements = await listStockMovements(tenantId, validation.data);

    return NextResponse.json({ success: true, data: movements }, { status: 200 });
  } catch (error) {
    console.error('Stock movements list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

