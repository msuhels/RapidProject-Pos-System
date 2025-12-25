import { pgTable, uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants, users } from '@/core/lib/db/baseSchema';

export interface OrderProduct {
  productId: string;
  quantity: string;
  price: string;
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
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
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
  }),
);

