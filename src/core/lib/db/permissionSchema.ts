import { 
  pgTable, 
  uuid,
  varchar, 
  text, 
  timestamp, 
  boolean,
  integer,
  jsonb,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { roles } from './baseSchema';
import { modules } from './baseSchema';
import { permissions } from './baseSchema';

/**
 * Role Module Access - Controls whether a role has access to a module
 * and what data access level they have
 */
export const roleModuleAccess = pgTable('role_module_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  hasAccess: boolean('has_access').default(false).notNull(),
  dataAccess: varchar('data_access', { length: 20 }).default('none').notNull(), // 'none', 'own', 'team', 'all'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  roleIdx: index('idx_role_module_access_role').on(table.roleId),
  moduleIdx: index('idx_role_module_access_module').on(table.moduleId),
  roleModuleUnique: unique('role_module_access_unique').on(table.roleId, table.moduleId),
}));

/**
 * Role Module Permissions - Granular permissions for a role within a module
 */
export const roleModulePermissions = pgTable('role_module_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  granted: boolean('granted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  roleIdx: index('idx_role_module_permissions_role').on(table.roleId),
  moduleIdx: index('idx_role_module_permissions_module').on(table.moduleId),
  permissionIdx: index('idx_role_module_permissions_permission').on(table.permissionId),
  roleModulePermissionUnique: unique('role_module_permissions_unique').on(table.roleId, table.moduleId, table.permissionId),
}));

/**
 * Module Fields - Defines fields that can have field-level permissions
 */
export const moduleFields = pgTable('module_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).notNull(),
  label: varchar('label', { length: 255 }),
  fieldType: varchar('field_type', { length: 50 }), // 'text', 'number', 'email', etc.
  description: text('description'),
  isSystemField: boolean('is_system_field').default(false).notNull(), // true for default/core fields, false for custom fields
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  moduleIdx: index('idx_module_fields_module').on(table.moduleId),
  codeIdx: index('idx_module_fields_code').on(table.code),
  moduleCodeUnique: unique('module_fields_module_code_unique').on(table.moduleId, table.code),
}));

/**
 * Role Field Permissions - Field-level visibility and editability permissions
 */
export const roleFieldPermissions = pgTable('role_field_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => moduleFields.id, { onDelete: 'cascade' }),
  isVisible: boolean('is_visible').default(false).notNull(),
  isEditable: boolean('is_editable').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  roleIdx: index('idx_role_field_permissions_role').on(table.roleId),
  moduleIdx: index('idx_role_field_permissions_module').on(table.moduleId),
  fieldIdx: index('idx_role_field_permissions_field').on(table.fieldId),
  roleModuleFieldUnique: unique('role_field_permissions_unique').on(table.roleId, table.moduleId, table.fieldId),
}));

