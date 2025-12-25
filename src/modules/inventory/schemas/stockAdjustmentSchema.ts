import { pgTable, uuid, varchar, timestamp, numeric, text, index } from 'drizzle-orm/pg-core';
import { tenants, users } from '@/core/lib/db/baseSchema';
import { products } from '../../products/schemas/productsSchema';

export const stockAdjustments = pgTable(
  'stock_adjustments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    adjustmentType: varchar('adjustment_type', { length: 50 }).notNull(), // 'increase' or 'decrease'
    quantity: numeric('quantity', { precision: 15, scale: 2 }).notNull(),
    previousQuantity: numeric('previous_quantity', { precision: 15, scale: 2 }).notNull(),
    newQuantity: numeric('new_quantity', { precision: 15, scale: 2 }).notNull(),
    reason: varchar('reason', { length: 100 }).notNull(), // 'damage', 'manual_correction', 'theft', 'expired', etc.
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_stock_adjustments_tenant').on(table.tenantId),
    productIdx: index('idx_stock_adjustments_product').on(table.productId),
    typeIdx: index('idx_stock_adjustments_type').on(table.adjustmentType),
    reasonIdx: index('idx_stock_adjustments_reason').on(table.reason),
    dateIdx: index('idx_stock_adjustments_date').on(table.createdAt),
  }),
);

