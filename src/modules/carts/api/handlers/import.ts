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
    const { carts: cartsData } = body;

    if (!Array.isArray(cartsData)) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < cartsData.length; i++) {
      const cartData = cartsData[i];
      const validation = createCartSchema.safeParse(cartData);

      if (!validation.success) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${validation.error.errors.map((e) => e.message).join(', ')}`);
        continue;
      }

      try {
        await createCart({
          data: validation.data,
          tenantId,
          userId,
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          total: cartsData.length,
          success: results.success,
          failed: results.failed,
          errors: results.errors,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Cart import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


