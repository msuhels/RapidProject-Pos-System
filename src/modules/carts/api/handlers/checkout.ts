import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listCartsForTenant } from '../../services/cartService';
import { createOrder } from '../../../orders/services/orderService';
import { db } from '@/core/lib/db';
import { carts } from '../../schemas/cartsSchema';
import { eq, and, isNull } from 'drizzle-orm';

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

    // Get all cart items for the current user
    const cartItems = await listCartsForTenant(tenantId, { userId });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Convert cart items to order products
    const orderProducts = cartItems.map((cart) => ({
      productId: cart.productId,
      quantity: cart.quantity,
      price: cart.productPrice || '0',
    }));

    // Create order
    const order = await createOrder({
      data: {
        userId,
        products: orderProducts,
      },
      tenantId,
      userId,
    });

    // Remove all cart items (soft delete)
    await db
      .update(carts)
      .set({
        deletedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(carts.tenantId, tenantId),
          eq(carts.userId, userId),
          isNull(carts.deletedAt),
        ),
      );

    return NextResponse.json(
      {
        success: true,
        data: {
          order,
          message: `Order created successfully with ${cartItems.length} product(s)`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

