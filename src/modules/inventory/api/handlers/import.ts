import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { updateInventoryItem } from '../../services/inventoryService';
import { z } from 'zod';

const importInventorySchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().max(100).optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  quantity: z.string().min(1).max(50).optional(),
  status: z.string().max(50).optional(),
});

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
    const { inventory: inventoryData } = body;

    if (!Array.isArray(inventoryData)) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < inventoryData.length; i++) {
      const itemData = inventoryData[i];
      const validation = importInventorySchema.safeParse(itemData);

      if (!validation.success) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${validation.error.errors.map((e) => e.message).join(', ')}`);
        continue;
      }

      if (!itemData.id) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Product ID is required`);
        continue;
      }

      try {
        await updateInventoryItem({
          id: itemData.id,
          tenantId,
          userId,
          data: validation.data,
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
          total: inventoryData.length,
          success: results.success,
          failed: results.failed,
          errors: results.errors,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Inventory import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
