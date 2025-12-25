import { and, desc, eq, ilike, isNull, or, gte, lte, inArray } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { orders } from '../schemas/ordersSchema';
import { products } from '../../products/schemas/productsSchema';
import { users } from '@/core/lib/db/baseSchema';
import { decreaseProductQuantity } from '../../products/services/productService';
import { isUserSuperAdmin } from '@/core/lib/permissions';
import type { Order, CreateOrderInput, UpdateOrderInput, OrderListFilters } from '../types';

export async function listOrdersForTenant(
  tenantId: string,
  filters: OrderListFilters = {},
  currentUserId?: string,
): Promise<Order[]> {
  const conditions = [eq(orders.tenantId, tenantId), isNull(orders.deletedAt)];

  if (filters.userId) {
    conditions.push(eq(orders.userId, filters.userId));
  }

  if (filters.dateFrom) {
    conditions.push(gte(orders.orderDate, new Date(filters.dateFrom)));
  }

  if (filters.dateTo) {
    conditions.push(lte(orders.orderDate, new Date(filters.dateTo)));
  }

  // Check if current user has SUPER_ADMIN role by querying user_roles bridge table
  const isSuperAdmin = currentUserId ? await isUserSuperAdmin(currentUserId) : false;

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    if (isSuperAdmin) {
      // Super Admin can search by user name and email
      conditions.push(
        or(
          ilike(orders.userId, searchTerm),
          ilike(orders.totalAmount, searchTerm),
          ilike(users.fullName, searchTerm),
          ilike(users.email, searchTerm),
        )!,
      );
    } else {
      // Regular users can only search by userId and totalAmount
      conditions.push(
        or(
          ilike(orders.userId, searchTerm),
          ilike(orders.totalAmount, searchTerm),
        )!,
      );
    }
  }

  // Conditionally join with users table only if current user is Super Admin
  const baseQuery = db
    .select({
      // Order fields
      id: orders.id,
      tenantId: orders.tenantId,
      userId: orders.userId,
      orderDate: orders.orderDate,
      products: orders.products,
      totalAmount: orders.totalAmount,
      labelIds: orders.labelIds,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      createdBy: orders.createdBy,
      updatedBy: orders.updatedBy,
      deletedAt: orders.deletedAt,
      // User fields (only if Super Admin)
      ...(isSuperAdmin
        ? {
            userName: users.fullName,
            userEmail: users.email,
          }
        : {}),
    })
    .from(orders);

  const queryWithJoin = isSuperAdmin
    ? baseQuery.leftJoin(users, eq(orders.userId, users.id))
    : baseQuery;

  const results = await queryWithJoin.where(and(...conditions)).orderBy(desc(orders.orderDate));

  // Get all unique product IDs from all orders
  const allProductIds = new Set<string>();
  results.forEach((r) => {
    const orderProducts = (r.products as any[]) || [];
    orderProducts.forEach((p) => {
      if (p.productId && typeof p.productId === 'string') {
        allProductIds.add(p.productId);
      }
    });
  });

  // Fetch all products in one query - filter by the product IDs from orders
  const productMap = new Map<string, { name: string }>();
  if (allProductIds.size > 0) {
    const productList = Array.from(allProductIds);
    try {
      const productResults = await db
        .select({
          id: products.id,
          name: products.name,
        })
        .from(products)
        .where(
          and(
            eq(products.tenantId, tenantId),
            isNull(products.deletedAt),
            inArray(products.id, productList),
          ),
        );

      productResults.forEach((p) => {
        if (p.id && p.name) {
          productMap.set(p.id, { name: p.name });
        }
      });
    } catch (error) {
      console.error('Error fetching products for orders:', error);
    }
  }

  // Map results and enrich products with names
  return results.map((r) => {
    const orderProducts = ((r.products as any[]) || []).map((p) => {
      // Use stored productName if available, otherwise fetch from map
      const productId = p.productId;
      const storedName = p.productName;
      const fetchedName = productId ? productMap.get(productId)?.name : null;
      return {
        ...p,
        productName: storedName || fetchedName || 'Unknown Product',
      };
    });

    const order: Order = {
      id: r.id,
      tenantId: r.tenantId,
      userId: r.userId,
      orderDate: r.orderDate.toISOString(),
      products: orderProducts,
      totalAmount: r.totalAmount || null,
      labelIds: (r.labelIds as string[]) || [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      createdBy: r.createdBy || null,
      updatedBy: r.updatedBy || null,
      deletedAt: r.deletedAt?.toISOString() || null,
    };

    // Only add userName and userEmail if current user is Super Admin
    if (isSuperAdmin) {
      order.userName = (r as any).userName || null;
      order.userEmail = (r as any).userEmail || null;
    }

    return order;
  });
}

export async function getOrderById(
  id: string,
  tenantId: string,
  currentUserId?: string,
): Promise<Order | null> {
  // Check if current user has SUPER_ADMIN role by querying user_roles bridge table
  const isSuperAdmin = currentUserId ? await isUserSuperAdmin(currentUserId) : false;

  const baseQuery = db
    .select({
      // Order fields
      id: orders.id,
      tenantId: orders.tenantId,
      userId: orders.userId,
      orderDate: orders.orderDate,
      products: orders.products,
      totalAmount: orders.totalAmount,
      labelIds: orders.labelIds,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      createdBy: orders.createdBy,
      updatedBy: orders.updatedBy,
      deletedAt: orders.deletedAt,
      // User fields (only if Super Admin)
      ...(isSuperAdmin
        ? {
            userName: users.fullName,
            userEmail: users.email,
          }
        : {}),
    })
    .from(orders);

  const queryWithJoin = isSuperAdmin
    ? baseQuery.leftJoin(users, eq(orders.userId, users.id))
    : baseQuery;

  const queryResult = await queryWithJoin
    .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId), isNull(orders.deletedAt)))
    .limit(1);

  if (queryResult.length === 0) return null;

  const r = queryResult[0];
  const orderProducts = (r.products as any[]) || [];

  // Fetch product names
  const productIds = orderProducts
    .map((p) => p.productId)
    .filter((id): id is string => Boolean(id) && typeof id === 'string');
  const productMap = new Map<string, { name: string }>();
  if (productIds.length > 0) {
    try {
      const productResults = await db
        .select({
          id: products.id,
          name: products.name,
        })
        .from(products)
        .where(
          and(
            eq(products.tenantId, tenantId),
            isNull(products.deletedAt),
            inArray(products.id, productIds),
          ),
        );

      productResults.forEach((p) => {
        if (p.id && p.name) {
          productMap.set(p.id, { name: p.name });
        }
      });
    } catch (error) {
      console.error('Error fetching products for order:', error);
    }
  }

  const enrichedProducts = orderProducts.map((p) => {
    // Use stored productName if available, otherwise fetch from map
    const productId = p.productId;
    const storedName = p.productName;
    const fetchedName = productId ? productMap.get(productId)?.name : null;
    return {
      ...p,
      productName: storedName || fetchedName || 'Unknown Product',
    };
  });

  const order: Order = {
    id: r.id,
    tenantId: r.tenantId,
    userId: r.userId,
    orderDate: r.orderDate.toISOString(),
    products: enrichedProducts,
    totalAmount: r.totalAmount || null,
    labelIds: (r.labelIds as string[]) || [],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    deletedAt: r.deletedAt?.toISOString() || null,
  };

  // Only add userName and userEmail if current user is Super Admin
  if (isSuperAdmin) {
    order.userName = (r as any).userName || null;
    order.userEmail = (r as any).userEmail || null;
  }

  return order;
}

export async function createOrder(params: {
  data: CreateOrderInput;
  tenantId: string;
  userId: string;
}): Promise<Order> {
  const { data, tenantId, userId } = params;

  // Validate products and calculate total amount
  let totalAmount = 0;
  const enrichedProducts = [];
  for (const product of data.products) {
    // Verify product exists and has sufficient stock
    const productResult = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        quantity: products.quantity,
      })
      .from(products)
      .where(eq(products.id, product.productId))
      .limit(1);

    if (productResult.length === 0) {
      throw new Error(`Product not found: ${product.productId}`);
    }

    const productData = productResult[0];
    const availableQuantity = parseInt(productData.quantity) || 0;
    const requestedQuantity = parseInt(product.quantity) || 0;

    if (requestedQuantity > availableQuantity) {
      throw new Error(
        `Insufficient stock for product ${productData.name}. Available: ${availableQuantity}, Requested: ${requestedQuantity}`,
      );
    }

    // Calculate total
    const price = parseFloat(product.price) || 0;
    totalAmount += price * requestedQuantity;

    // Store product name with the product data
    enrichedProducts.push({
      ...product,
      productName: productData.name,
    });
  }

  // Create order record with enriched products (including product names)
  const orderDate = data.orderDate ? new Date(data.orderDate) : new Date();
  const [orderResult] = await db
    .insert(orders)
    .values({
      tenantId,
      userId: data.userId,
      orderDate,
      products: enrichedProducts, // Store products with names
      totalAmount: totalAmount.toFixed(2),
      labelIds: data.labelIds || [],
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  // Decrease product quantities
  for (const product of data.products) {
    const requestedQuantity = parseInt(product.quantity) || 0;
    await decreaseProductQuantity(product.productId, tenantId, requestedQuantity, userId);
  }

  // Update customer's totalPurchases
  try {
    const { getCustomerByUserId, updateCustomer, createCustomer } = await import('../../customer_management/services/customerService');
    const { users } = await import('@/core/lib/db/baseSchema');
    
    // Get user info to create customer if needed
    const userInfo = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);

    let customer = await getCustomerByUserId(data.userId, tenantId);
    
    // If customer doesn't exist, create one
    if (!customer && userInfo.length > 0) {
      const user = userInfo[0];
      customer = await createCustomer({
        data: {
          name: user.fullName || user.email || 'Customer',
          email: user.email,
          phoneNumber: user.phoneNumber || undefined,
          isActive: true,
        },
        tenantId,
        userId: userId,
        linkedUserId: data.userId,
      });
    }

    if (customer) {
      // Get all orders for this customer to calculate total
      const allOrders = await listOrdersForTenant(tenantId, { userId: data.userId });
      const newTotalPurchases = allOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.totalAmount || '0') || 0);
      }, 0);

      await updateCustomer({
        id: customer.id,
        tenantId,
        userId,
        data: {
          totalPurchases: newTotalPurchases,
        },
      });
    }
  } catch (error) {
    console.error('Failed to update customer totalPurchases:', error);
    // Don't fail order creation if customer update fails
  }

  return {
    ...orderResult,
    labelIds: (orderResult.labelIds as string[]) || [],
    products: orderProducts.map((p) => ({
      ...p,
      productName: p.productName || 'Unknown Product',
    })),
    totalAmount: orderResult.totalAmount || null,
    orderDate: orderResult.orderDate.toISOString(),
    createdAt: orderResult.createdAt.toISOString(),
    updatedAt: orderResult.updatedAt.toISOString(),
    createdBy: orderResult.createdBy || null,
    updatedBy: orderResult.updatedBy || null,
    deletedAt: orderResult.deletedAt?.toISOString() || null,
  };
}

export async function updateOrder(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateOrderInput;
}): Promise<Order | null> {
  const { id, tenantId, userId, data } = params;

  const existing = await getOrderById(id, tenantId);
  if (!existing) return null;

  let finalProducts = data.products ?? existing.products;
  let finalOrderDate = data.orderDate ? new Date(data.orderDate) : new Date(existing.orderDate);
  let totalAmount = 0;

  // If products changed, recalculate total
  if (data.products) {
    for (const product of finalProducts) {
      const price = parseFloat(product.price) || 0;
      const quantity = parseInt(product.quantity) || 0;
      totalAmount += price * quantity;
    }
  } else {
    totalAmount = parseFloat(existing.totalAmount || '0') || 0;
  }

  const [orderResult] = await db
    .update(orders)
    .set({
      userId: data.userId ?? existing.userId,
      orderDate: finalOrderDate,
      products: finalProducts,
      totalAmount: totalAmount.toFixed(2),
      labelIds: data.labelIds ?? existing.labelIds,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)))
    .returning();

  // Update customer's totalPurchases
  try {
    const finalUserId = data.userId ?? existing.userId;
    const { getCustomerByUserId, updateCustomer } = await import('../../customer_management/services/customerService');
    const customer = await getCustomerByUserId(finalUserId, tenantId);
    if (customer) {
      // Get all orders for this customer to calculate total
      const allOrders = await listOrdersForTenant(tenantId, { userId: finalUserId });
      const newTotalPurchases = allOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.totalAmount || '0') || 0);
      }, 0);

      await updateCustomer({
        id: customer.id,
        tenantId,
        userId,
        data: {
          totalPurchases: newTotalPurchases,
        },
      });
    }
  } catch (error) {
    console.error('Failed to update customer totalPurchases:', error);
    // Don't fail order update if customer update fails
  }

  return {
    ...orderResult,
    labelIds: (orderResult.labelIds as string[]) || [],
    products: (orderResult.products as any[]) || [],
    totalAmount: orderResult.totalAmount || null,
    orderDate: orderResult.orderDate.toISOString(),
    createdAt: orderResult.createdAt.toISOString(),
    updatedAt: orderResult.updatedAt.toISOString(),
    createdBy: orderResult.createdBy || null,
    updatedBy: orderResult.updatedBy || null,
    deletedAt: orderResult.deletedAt?.toISOString() || null,
  };
}

export async function deleteOrder(id: string, tenantId: string, userId: string): Promise<boolean> {
  const existing = await getOrderById(id, tenantId);
  if (!existing) return false;

  await db
    .update(orders)
    .set({
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));

  // Update customer's totalPurchases after order deletion
  try {
    const { getCustomerByUserId, updateCustomer } = await import('../../customer_management/services/customerService');
    const customer = await getCustomerByUserId(existing.userId, tenantId);
    if (customer) {
      // Get all non-deleted orders for this customer to calculate total
      const allOrders = await listOrdersForTenant(tenantId, { userId: existing.userId });
      const newTotalPurchases = allOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.totalAmount || '0') || 0);
      }, 0);

      await updateCustomer({
        id: customer.id,
        tenantId,
        userId,
        data: {
          totalPurchases: newTotalPurchases,
        },
      });
    }
  } catch (error) {
    console.error('Failed to update customer totalPurchases:', error);
    // Don't fail order deletion if customer update fails
  }

  return true;
}

export async function duplicateOrder(
  id: string,
  tenantId: string,
  userId: string,
): Promise<Order | null> {
  const existing = await getOrderById(id, tenantId);
  if (!existing) return null;

  return createOrder({
    data: {
      userId: existing.userId,
      orderDate: new Date().toISOString(),
      products: existing.products,
      labelIds: existing.labelIds,
    },
    tenantId,
    userId,
  });
}

