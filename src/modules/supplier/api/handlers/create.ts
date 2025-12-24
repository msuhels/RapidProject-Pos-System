import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { createSupplier } from '../../services/supplierService';
import { createSupplierSchema } from '../../schemas/supplierValidation';

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
    const hasPermission = await userHasPermission(userId, 'supplier:create') ||
      await userHasPermission(userId, 'supplier:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = createSupplierSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const record = await createSupplier({
      data: validationResult.data,
      tenantId,
      userId,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: any) {
    console.error('Supplier create error:', error);
    if (error.message && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

