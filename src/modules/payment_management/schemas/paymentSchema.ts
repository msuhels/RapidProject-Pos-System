import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { tenants } from '@/core/lib/db/baseSchema';

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    supportsRefund: boolean('supports_refund').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('idx_payment_methods_tenant').on(table.tenantId),
    nameIdx: index('idx_payment_methods_name').on(table.name),
    activeIdx: index('idx_payment_methods_active').on(table.isActive),
  }),
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    saleReference: varchar('sale_reference', { length: 255 }).notNull(),
    paymentMethodId: uuid('payment_method_id')
      .notNull()
      .references(() => paymentMethods.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    paymentStatus: varchar('payment_status', { length: 50 }).notNull(),
    transactionReference: varchar('transaction_reference', { length: 255 }),
    paymentDate: timestamp('payment_date').defaultNow().notNull(),
    notes: text('notes'),
    isReversed: boolean('is_reversed').default(false).notNull(),
    reversedBy: uuid('reversed_by'),
    reversedAt: timestamp('reversed_at'),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
  },
  (table) => ({
    tenantIdx: index('idx_payments_tenant').on(table.tenantId),
    saleRefIdx: index('idx_payments_sale_reference').on(table.saleReference),
    methodIdx: index('idx_payments_method').on(table.paymentMethodId),
    statusIdx: index('idx_payments_status').on(table.paymentStatus),
    dateIdx: index('idx_payments_date').on(table.paymentDate),
    reversedIdx: index('idx_payments_reversed').on(table.isReversed),
  }),
);


