import { pgTable, uuid, varchar, timestamp, numeric, text, index } from 'drizzle-orm/pg-core';
import { tenants, users } from '@/core/lib/db/baseSchema';
import { products } from '../../products/schemas/productsSchema';

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    movementType: varchar('movement_type', { length: 50 }).notNull(), // 'increase', 'decrease', 'adjustment'
    quantity: numeric('quantity', { precision: 15, scale: 2 }).notNull(),
    previousQuantity: numeric('previous_quantity', { precision: 15, scale: 2 }).notNull(),
    newQuantity: numeric('new_quantity', { precision: 15, scale: 2 }).notNull(),
    reason: varchar('reason', { length: 100 }), // 'sale', 'order_void', 'adjustment', 'damage', 'manual_correction', etc.
    referenceId: uuid('reference_id'), // Order ID, Adjustment ID, etc.
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('idx_stock_movements_tenant').on(table.tenantId),
    productIdx: index('idx_stock_movements_product').on(table.productId),
    typeIdx: index('idx_stock_movements_type').on(table.movementType),
    reasonIdx: index('idx_stock_movements_reason').on(table.reason),
    referenceIdx: index('idx_stock_movements_reference').on(table.referenceId),
    dateIdx: index('idx_stock_movements_date').on(table.createdAt),
  }),
);

