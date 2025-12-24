import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { updateCustomer } from '../../services/customerService';
import { updateCustomerSchema } from '../../schemas/customerValidation';

export async function PATCH(
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
    const hasPermission = await userHasPermission(userId, 'customer_management:update') ||
      await userHasPermission(userId, 'customer_management:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = context.params;
    const body = await request.json();

    // Validate input
    const validationResult = updateCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const updated = await updateCustomer({
      id,
      tenantId,
      userId,
      data: validationResult.data,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

