import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { getSupplierById } from '../../services/supplierService';

export async function GET(
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
    const hasPermission = await userHasPermission(userId, 'supplier:read') ||
      await userHasPermission(userId, 'supplier:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = context.params;
    const record = await getSupplierById(id, tenantId);

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record }, { status: 200 });
  } catch (error) {
    console.error('Supplier getById error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

