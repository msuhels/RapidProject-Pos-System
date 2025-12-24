import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { createProduct } from '../../services/productService';
import { createProductSchema } from '../../schemas/productsValidation';

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
    const { products: productsData } = body;

    if (!Array.isArray(productsData)) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < productsData.length; i++) {
      const productData = productsData[i];
      const validation = createProductSchema.safeParse(productData);

      if (!validation.success) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${validation.error.errors.map((e) => e.message).join(', ')}`);
        continue;
      }

      try {
        await createProduct({
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
          total: productsData.length,
          success: results.success,
          failed: results.failed,
          errors: results.errors,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Product import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

