import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { deleteSupplier } from '../../services/supplierService';

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } },
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

    // Check permission
    const hasPermission = await userHasPermission(userId, 'supplier:delete') ||
      await userHasPermission(userId, 'supplier:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = context.params;
    const ok = await deleteSupplier(id, tenantId, userId);

    if (!ok) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Supplier delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

