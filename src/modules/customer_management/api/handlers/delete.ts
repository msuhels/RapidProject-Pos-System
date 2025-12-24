import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { deleteCustomer } from '../../services/customerService';

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

    // Check permission - allow both delete and deactivate
    const hasDeletePermission = await userHasPermission(userId, 'customer_management:delete') ||
      await userHasPermission(userId, 'customer_management:*');
    const hasDeactivatePermission = await userHasPermission(userId, 'customer_management:deactivate') ||
      await userHasPermission(userId, 'customer_management:*');

    if (!hasDeletePermission && !hasDeactivatePermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = context.params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hardDelete') === 'true';

    // Prevent hard delete if user only has deactivate permission
    if (hardDelete && !hasDeletePermission) {
      return NextResponse.json({ error: 'Permission denied for hard delete' }, { status: 403 });
    }

    const ok = await deleteCustomer(id, tenantId, userId, hardDelete);

    if (!ok) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


