import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { tenants } from '@/core/lib/db/baseSchema';

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    supplierCode: varchar('supplier_code', { length: 100 }).notNull(),
    supplierName: varchar('supplier_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 30 }),
    address: text('address'),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
  },
  (table) => ({
    tenantIdx: index('idx_suppliers_tenant').on(table.tenantId),
    supplierCodeIdx: index('idx_suppliers_code').on(table.supplierCode),
    supplierNameIdx: index('idx_suppliers_name').on(table.supplierName),
    emailIdx: index('idx_suppliers_email').on(table.email),
    phoneIdx: index('idx_suppliers_phone').on(table.phone),
    statusIdx: index('idx_suppliers_status').on(table.status),
    deletedIdx: index('idx_suppliers_deleted').on(table.deletedAt),
    tenantCodeIdx: index('idx_suppliers_tenant_code').on(table.tenantId, table.supplierCode),
  }),
);

