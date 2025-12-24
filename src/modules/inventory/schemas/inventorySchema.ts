import { pgTable, uuid, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants, users } from '@/core/lib/db/baseSchema';
import { products } from '../../products/schemas/productsSchema';

export const inventory = pgTable(
  'inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 100 }),
    location: varchar('location', { length: 100 }),
    quantity: varchar('quantity', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('in_stock'),
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_inventory_tenant').on(table.tenantId),
    productIdx: index('idx_inventory_product').on(table.productId),
    statusIdx: index('idx_inventory_status').on(table.status),
  }),
);


