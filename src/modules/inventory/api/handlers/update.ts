import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { updateInventoryItem } from '../../services/inventoryService';
import { z } from 'zod';

const updateInventorySchema = z.object({
  sku: z.string().max(100, 'SKU is too long').optional().or(z.literal('')),
  location: z.string().max(100, 'Location is too long').optional().or(z.literal('')),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .max(50, 'Quantity is too long')
    .optional(),
  status: z.string().max(50, 'Status is too long').optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const validation = updateInventorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 },
      );
    }

    const record = await updateInventoryItem({
      id: params.id,
      tenantId,
      userId,
      data: validation.data,
    });

    if (!record) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record }, { status: 200 });
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
