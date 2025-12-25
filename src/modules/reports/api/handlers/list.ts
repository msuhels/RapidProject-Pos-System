import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listReportsForTenant } from '../../services/reportService';
import { z } from 'zod';

const reportTypeSchema = z.enum([
  'daily_sales',
  'weekly_sales',
  'monthly_sales',
  'product_wise',
  'user_wise',
  'payment_method_wise',
  'low_stock',
]);

const listReportsQuerySchema = z.object({
  reportType: reportTypeSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  productId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  paymentMethod: z.string().optional(),
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

    const { searchParams } = new URL(request.url);
    const queryParams = {
      reportType: searchParams.get('reportType') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      productId: searchParams.get('productId') || undefined,
      userId: searchParams.get('userId') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
    };

    // Validate query parameters
    const validationResult = listReportsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const records = await listReportsForTenant(tenantId, validationResult.data);

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error('Report list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

