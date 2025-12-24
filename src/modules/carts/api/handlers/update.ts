import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { updateCart } from '../../services/cartService';
import { updateCartSchema } from '../../schemas/cartsValidation';

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
    
    // First, get the existing cart to verify ownership
    const { getCartById } = await import('../../services/cartService');
    const existingCart = await getCartById(params.id, tenantId);
    
    if (!existingCart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }
    
    // Ensure user can only update their own carts
    if (existingCart.userId !== userId) {
      return NextResponse.json({ error: 'You can only update your own carts' }, { status: 403 });
    }

    const validation = updateCartSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 },
      );
    }

    // Ensure userId is set to current user (cannot be changed)
    const updateData = { ...validation.data, userId };

    try {
      const record = await updateCart({
        id: params.id,
        tenantId,
        userId,
        data: updateData,
      });

      if (!record) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: record }, { status: 200 });
    } catch (error) {
      // If it's a validation error from the service, return it
      if (error instanceof Error && error.message.includes('Insufficient stock')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Cart update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

