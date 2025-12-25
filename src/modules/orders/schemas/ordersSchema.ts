import { pgTable, uuid, varchar, timestamp, jsonb, index, numeric, text, boolean } from 'drizzle-orm/pg-core';
import { tenants, users } from '@/core/lib/db/baseSchema';

export interface OrderProduct {
  productId: string;
  quantity: string;
  price: string;
  productName?: string;
  taxRate?: string;
}

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    orderDate: timestamp('order_date').defaultNow().notNull(),
    products: jsonb('products').$type<OrderProduct[]>().notNull().default([]),
    totalAmount: varchar('total_amount', { length: 50 }),
    subtotalAmount: numeric('subtotal_amount', { precision: 15, scale: 2 }),
    taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }),
    discountAmount: numeric('discount_amount', { precision: 15, scale: 2 }),
    discountType: varchar('discount_type', { length: 50 }), // 'percentage' or 'fixed'
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
    isVoided: boolean('is_voided').default(false).notNull(),
    voidedBy: uuid('voided_by'),
    voidedAt: timestamp('voided_at'),
    voidReason: text('void_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_orders_tenant').on(table.tenantId),
    userIdx: index('idx_orders_user').on(table.userId),
    dateIdx: index('idx_orders_date').on(table.orderDate),
    voidedIdx: index('idx_orders_voided').on(table.isVoided),
  }),
);

