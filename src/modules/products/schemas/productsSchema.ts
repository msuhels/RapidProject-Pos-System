import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants } from '@/core/lib/db/baseSchema';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    price: varchar('price', { length: 50 }).notNull(),
    costPrice: varchar('cost_price', { length: 50 }),
    sellingPrice: varchar('selling_price', { length: 50 }),
    taxRate: varchar('tax_rate', { length: 50 }),
    quantity: varchar('quantity', { length: 50 }).notNull(),
    image: text('image'),
    category: varchar('category', { length: 100 }),
    sku: varchar('sku', { length: 100 }),
    location: varchar('location', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('in_stock'),
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_products_tenant').on(table.tenantId),
    categoryIdx: index('idx_products_category').on(table.category),
    nameIdx: index('idx_products_name').on(table.name),
    statusIdx: index('idx_products_status').on(table.status),
    locationIdx: index('idx_products_location').on(table.location),
  }),
);

