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
import { tenants, users } from '@/core/lib/db/baseSchema';

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 30 }),
    email: varchar('email', { length: 255 }),
    totalPurchases: numeric('total_purchases', { precision: 15, scale: 2 }).default('0').notNull(),
    outstandingBalance: numeric('outstanding_balance', { precision: 15, scale: 2 }).default('0').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
  },
  (table) => ({
    tenantIdx: index('idx_customers_tenant').on(table.tenantId),
    userIdIdx: index('idx_customers_user').on(table.userId),
    nameIdx: index('idx_customers_name').on(table.name),
    emailIdx: index('idx_customers_email').on(table.email),
    phoneIdx: index('idx_customers_phone').on(table.phoneNumber),
    isActiveIdx: index('idx_customers_is_active').on(table.isActive),
    deletedIdx: index('idx_customers_deleted').on(table.deletedAt),
  }),
);


