import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants, users } from '@/core/lib/db/baseSchema';
import { products } from '../../products/schemas/productsSchema';

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    productName: varchar('product_name', { length: 255 }),
    productPrice: varchar('product_price', { length: 50 }),
    quantity: varchar('quantity', { length: 50 }).notNull(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_carts_tenant').on(table.tenantId),
    productIdx: index('idx_carts_product').on(table.productId),
    userIdx: index('idx_carts_user').on(table.userId),
  }),
);

