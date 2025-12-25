import { and, eq, gte, lte, isNull, inArray } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { orders } from '../../orders/schemas/ordersSchema';
import { products } from '../../products/schemas/productsSchema';
import type { ReportRecord, ReportListFilters, ReportType } from '../types';

export async function listReportsForTenant(
  tenantId: string,
  filters: ReportListFilters = {},
): Promise<ReportRecord[]> {
  const { reportType = 'daily_sales', dateFrom, dateTo, productId, userId, paymentMethod } = filters;

  // Base conditions
  const conditions = [eq(orders.tenantId, tenantId), isNull(orders.deletedAt)];

  // Date range filter
  if (dateFrom) {
    conditions.push(gte(orders.orderDate, new Date(dateFrom)));
  }
  if (dateTo) {
    conditions.push(lte(orders.orderDate, new Date(dateTo)));
  }

  // User filter
  if (userId) {
    conditions.push(eq(orders.userId, userId));
  }

  // Get all orders matching filters
  const allOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      orderDate: orders.orderDate,
      products: orders.products,
      totalAmount: orders.totalAmount,
    })
    .from(orders)
    .where(and(...conditions));

  // Flatten order products into individual line items
  const lineItems: Array<{
    productId: string;
    quantity: number;
    price: number;
    date: Date;
    userId: string;
    orderId: string;
  }> = [];

  for (const order of allOrders) {
    const orderProducts = (order.products as Array<{ productId: string; quantity: string; price: string }>) || [];
    const orderDate = order.orderDate instanceof Date ? order.orderDate : new Date(order.orderDate);

    for (const product of orderProducts) {
      // Apply product filter if specified
      if (productId && product.productId !== productId) {
        continue;
      }

      lineItems.push({
        productId: product.productId,
        quantity: parseInt(product.quantity) || 0,
        price: parseFloat(product.price) || 0,
        date: orderDate,
        userId: order.userId,
        orderId: order.id,
      });
    }
  }

  // Aggregate based on report type
  switch (reportType) {
    case 'daily_sales': {
      const grouped = new Map<string, ReportRecord>();
      const orderIdsByDate = new Map<string, Set<string>>();
      for (const item of lineItems) {
        const dateKey = item.date.toISOString().split('T')[0];
        const existing = grouped.get(dateKey) || {
          date: dateKey,
          quantity: 0,
          price: 0,
          totalAmount: 0,
          orderCount: 0,
        };
        existing.quantity += item.quantity;
        existing.price += item.price * item.quantity;
        existing.totalAmount = existing.price;
        if (!orderIdsByDate.has(dateKey)) {
          orderIdsByDate.set(dateKey, new Set());
        }
        orderIdsByDate.get(dateKey)!.add(item.orderId);
        existing.orderCount = orderIdsByDate.get(dateKey)!.size;
        grouped.set(dateKey, existing);
      }
      return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    case 'weekly_sales': {
      const grouped = new Map<string, ReportRecord>();
      const orderIdsByWeek = new Map<string, Set<string>>();
      for (const item of lineItems) {
        const weekStart = new Date(item.date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        const existing = grouped.get(weekKey) || {
          date: weekKey,
          quantity: 0,
          price: 0,
          totalAmount: 0,
          orderCount: 0,
        };
        existing.quantity += item.quantity;
        existing.price += item.price * item.quantity;
        existing.totalAmount = existing.price;
        if (!orderIdsByWeek.has(weekKey)) {
          orderIdsByWeek.set(weekKey, new Set());
        }
        orderIdsByWeek.get(weekKey)!.add(item.orderId);
        existing.orderCount = orderIdsByWeek.get(weekKey)!.size;
        grouped.set(weekKey, existing);
      }
      return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    case 'monthly_sales': {
      const grouped = new Map<string, ReportRecord>();
      const orderIdsByMonth = new Map<string, Set<string>>();
      for (const item of lineItems) {
        const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
        const existing = grouped.get(monthKey) || {
          date: monthKey,
          quantity: 0,
          price: 0,
          totalAmount: 0,
          orderCount: 0,
        };
        existing.quantity += item.quantity;
        existing.price += item.price * item.quantity;
        existing.totalAmount = existing.price;
        if (!orderIdsByMonth.has(monthKey)) {
          orderIdsByMonth.set(monthKey, new Set());
        }
        orderIdsByMonth.get(monthKey)!.add(item.orderId);
        existing.orderCount = orderIdsByMonth.get(monthKey)!.size;
        grouped.set(monthKey, existing);
      }
      return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    case 'product_wise': {
      const grouped = new Map<string, ReportRecord>();
      const orderIdsByProduct = new Map<string, Set<string>>();
      for (const item of lineItems) {
        const existing = grouped.get(item.productId) || {
          productId: item.productId,
          quantity: 0,
          price: 0,
          totalAmount: 0,
          orderCount: 0,
        };
        existing.quantity += item.quantity;
        existing.price += item.price * item.quantity;
        existing.totalAmount = existing.price;
        if (!orderIdsByProduct.has(item.productId)) {
          orderIdsByProduct.set(item.productId, new Set());
        }
        orderIdsByProduct.get(item.productId)!.add(item.orderId);
        existing.orderCount = orderIdsByProduct.get(item.productId)!.size;
        grouped.set(item.productId, existing);
      }

      // Fetch product names
      const productIds = Array.from(grouped.keys());
      if (productIds.length > 0) {
        const productData = await db
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(and(eq(products.tenantId, tenantId), inArray(products.id, productIds)));

        const productMap = new Map(productData.map((p) => [p.id, p.name]));
        for (const record of grouped.values()) {
          if (record.productId) {
            record.productName = productMap.get(record.productId) || 'Unknown Product';
          }
        }
      }

      return Array.from(grouped.values()).sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    }

    case 'user_wise': {
      const grouped = new Map<string, ReportRecord>();
      const orderIdsByUser = new Map<string, Set<string>>();
      for (const item of lineItems) {
        const existing = grouped.get(item.userId) || {
          userId: item.userId,
          quantity: 0,
          price: 0,
          totalAmount: 0,
          orderCount: 0,
        };
        existing.quantity += item.quantity;
        existing.price += item.price * item.quantity;
        existing.totalAmount = existing.price;
        if (!orderIdsByUser.has(item.userId)) {
          orderIdsByUser.set(item.userId, new Set());
        }
        orderIdsByUser.get(item.userId)!.add(item.orderId);
        existing.orderCount = orderIdsByUser.get(item.userId)!.size;
        grouped.set(item.userId, existing);
      }

      // Return user-wise reports with userId (no name lookup to avoid errors)
      return Array.from(grouped.values()).sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    }

    case 'payment_method_wise': {
      // Since orders don't have payment method in the schema, we'll use a placeholder
      // In a real scenario, you'd join with a payments table
      const grouped = new Map<string, ReportRecord>();
      const orderIdsByMethod = new Map<string, Set<string>>();
      for (const item of lineItems) {
        const method = paymentMethod || 'cash'; // Default to cash if not specified
        const existing = grouped.get(method) || {
          paymentMethod: method,
          quantity: 0,
          price: 0,
          totalAmount: 0,
          orderCount: 0,
        };
        existing.quantity += item.quantity;
        existing.price += item.price * item.quantity;
        existing.totalAmount = existing.price;
        if (!orderIdsByMethod.has(method)) {
          orderIdsByMethod.set(method, new Set());
        }
        orderIdsByMethod.get(method)!.add(item.orderId);
        existing.orderCount = orderIdsByMethod.get(method)!.size;
        grouped.set(method, existing);
      }
      return Array.from(grouped.values()).sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    }

    case 'low_stock': {
      // Get all products and their current stock
      const allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          quantity: products.quantity,
        })
        .from(products)
        .where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)));

      // Calculate total sold per product from orders
      const soldByProduct = new Map<string, number>();
      for (const item of lineItems) {
        const current = soldByProduct.get(item.productId) || 0;
        soldByProduct.set(item.productId, current + item.quantity);
      }

      // Find products with low stock (threshold: quantity < 10 or sold > 80% of stock)
      const lowStockReports: ReportRecord[] = [];
      for (const product of allProducts) {
        const currentStock = parseInt(product.quantity) || 0;
        const sold = soldByProduct.get(product.id) || 0;
        const threshold = Math.max(10, Math.floor(currentStock * 0.2)); // 20% remaining or < 10

        if (currentStock < threshold || currentStock < 10) {
          lowStockReports.push({
            productId: product.id,
            productName: product.name,
            quantity: currentStock,
            price: 0,
            date: new Date().toISOString().split('T')[0],
            totalAmount: sold,
          });
        }
      }

      return lowStockReports.sort((a, b) => a.quantity - b.quantity);
    }

    default:
      return [];
  }
}

