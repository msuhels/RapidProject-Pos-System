import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { createCart } from '../../services/cartService';
import { createCartSchema } from '../../schemas/cartsValidation';

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
    const validation = createCartSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 },
      );
    }

    const record = await createCart({
      data: validation.data,
      tenantId,
      userId,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Cart create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

