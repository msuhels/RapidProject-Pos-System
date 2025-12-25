import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listCartsForTenant } from '../../services/cartService';
import { createOrder } from '../../../orders/services/orderService';
import { db } from '@/core/lib/db';
import { carts } from '../../schemas/cartsSchema';
import { products } from '../../../products/schemas/productsSchema';
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

    // Convert cart items to order products with proper pricing (discount + tax)
    const orderProducts = await Promise.all(
      cartItems.map(async (cart) => {
        // Fetch product details to get discount and tax
        const productResult = await db
          .select({
            price: products.price,
            discountType: products.discountType,
            discountValue: products.discountValue,
            taxRate: products.taxRate,
            sellingPrice: products.sellingPrice,
          })
          .from(products)
          .where(eq(products.id, cart.productId))
          .limit(1);

        if (productResult.length === 0) {
          throw new Error(`Product not found: ${cart.productId}`);
        }

        const product = productResult[0];
        const basePrice = parseFloat(product.price || '0');
        const discountType = product.discountType || 'amount';
        const discountValue = parseFloat(product.discountValue || '0');
        const taxRate = parseFloat(product.taxRate || '0');

        // Calculate discount
        let discountAmount = 0;
        if (discountType === 'percentage') {
          discountAmount = basePrice * (discountValue / 100);
        } else {
          discountAmount = discountValue;
        }

        const discountedPrice = Math.max(0, basePrice - discountAmount);
        const taxAmount = discountedPrice * (taxRate / 100);
        const finalPrice = discountedPrice + taxAmount;

        return {
          productId: cart.productId,
          quantity: cart.quantity,
          price: finalPrice.toFixed(2), // Use final price (after discount + tax)
        };
      })
    );

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

