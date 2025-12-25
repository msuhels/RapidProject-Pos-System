import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { listStockAdjustments } from '../../../services/stockAdjustmentService';
import { z } from 'zod';

const listStockAdjustmentsQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  adjustmentType: z.enum(['increase', 'decrease']).optional(),
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
    const filters: Record<string, string | undefined> = {};
    
    // Only include filters that are actually provided
    const productId = searchParams.get('productId');
    if (productId) filters.productId = productId;
    
    const adjustmentType = searchParams.get('adjustmentType');
    if (adjustmentType && (adjustmentType === 'increase' || adjustmentType === 'decrease')) {
      filters.adjustmentType = adjustmentType;
    }
    
    const reason = searchParams.get('reason');
    if (reason) filters.reason = reason;
    
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) filters.dateFrom = dateFrom;
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) filters.dateTo = dateTo;

    const validation = listStockAdjustmentsQuerySchema.safeParse(filters);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 },
      );
    }

    const adjustments = await listStockAdjustments(tenantId, validation.data);

    return NextResponse.json({ success: true, data: adjustments }, { status: 200 });
  } catch (error) {
    console.error('Stock adjustments list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

