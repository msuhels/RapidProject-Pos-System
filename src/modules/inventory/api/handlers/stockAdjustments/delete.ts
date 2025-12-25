import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { deleteStockAdjustment } from '../../../services/stockAdjustmentService';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check permission (admin only for delete)
    const hasPermission =
      (await userHasPermission(userId, 'inventory:delete')) ||
      (await userHasPermission(userId, 'inventory:*')) ||
      (await userHasPermission(userId, 'admin:*'));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const success = await deleteStockAdjustment(params.id, tenantId, userId);

    if (!success) {
      return NextResponse.json({ error: 'Stock adjustment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Stock adjustment delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

