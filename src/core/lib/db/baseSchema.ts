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
  unique,
  date,
  char,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// 1. AUTHENTICATION CORE TABLES
// ============================================================================

// Note: tenants and roles are referenced before definition, but PostgreSQL allows this
// We'll define them in the correct order

// Core identity table - aligned with core.sql
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  // Extended profile details (aligned with core.sql)
  phoneNumber: varchar('phone_number', { length: 30 }),
  jobTitle: varchar('job_title', { length: 100 }),
  department: varchar('department', { length: 100 }),
  companyName: varchar('company_name', { length: 255 }),
  dateOfBirth: date('date_of_birth'),
  bio: text('bio'),
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // active, inactive, suspended, pending
  isEmailVerified: boolean('email_verified').default(false).notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  twoFactorSecret: text('two_factor_secret'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  locale: varchar('locale', { length: 10 }).default('en'),
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: varchar('last_login_ip', { length: 45 }),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  tenantIdx: index('idx_users_tenant').on(table.tenantId),
  tenantEmailUnique: unique('users_tenant_email_unique').on(table.tenantId, table.email),
  deletedIdx: index('idx_users_deleted').on(table.deletedAt),
  statusIdx: index('idx_users_status').on(table.status),
  lockedIdx: index('idx_users_locked').on(table.lockedUntil),
}));

// Supports email/password AND external login (Google, GitHub, Azure AD, etc.)
export const authProviders = pgTable('auth_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 100 }).notNull(),
  providerUserId: varchar('provider_user_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_auth_providers_user').on(table.userId),
}));

// Secure, stored server-side. Supports token rotation + invalidation
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  revokedAt: timestamp('revoked_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
}, (table) => ({
  userIdx: index('idx_refresh_tokens_user').on(table.userId),
  hashIdx: index('idx_refresh_tokens_hash').on(table.tokenHash),
}));

// Access tokens (optional, but good for enterprise logging)
export const accessTokens = pgTable('access_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  revokedAt: timestamp('revoked_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
}, (table) => ({
  userIdx: index('idx_access_tokens_user').on(table.userId),
  hashIdx: index('idx_access_tokens_hash').on(table.tokenHash),
}));

// Password reset tokens for forgot password functionality
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  usedAt: timestamp('used_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
}, (table) => ({
  userIdx: index('idx_password_reset_tokens_user').on(table.userId),
  tokenIdx: index('idx_password_reset_tokens_token').on(table.token),
  expiresIdx: index('idx_password_reset_tokens_expires').on(table.expiresAt),
}));

// Note: Email verification now uses JWT tokens (no database storage needed)

// ============================================================================
// 2. RBAC (Role-Based Access Control) - ENHANCED VERSION
// ============================================================================

// High-level functional areas of your SaaS
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  codeIdx: index('idx_modules_code').on(table.code),
}));

export const moduleLabels = pgTable('module_labels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }).notNull().default('#3b82f6'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  moduleIdx: index('idx_module_labels_module').on(table.moduleId),
  tenantIdx: index('idx_module_labels_tenant').on(table.tenantId),
  tenantModuleNameUnique: unique('module_labels_tenant_module_name_unique').on(table.tenantId, table.moduleId, table.name),
}));

// Permission groups (reusable permission sets) - from core.sql
export const permissionGroups = pgTable('permission_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantCodeUnique: unique('permission_groups_tenant_code_unique').on(table.tenantId, table.code),
}));

// Permission group items (many-to-many between groups and permissions)
export const permissionGroupItems = pgTable('permission_group_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => permissionGroups.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({
  groupIdx: index('idx_pg_items_group').on(table.groupId),
  groupPermissionUnique: unique('permission_group_items_unique').on(table.groupId, table.permissionId),
}));

// Define atomic permissions - aligned with core.sql (module:action format)
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).notNull().unique(), // Format: module:action (e.g., users:create)
  name: varchar('name', { length: 255 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  resource: varchar('resource', { length: 50 }),
  action: varchar('action', { length: 50 }).notNull(), // create, read, update, delete, execute, manage, approve
  description: text('description'),
  isDangerous: boolean('is_dangerous').default(false).notNull(), // Requires extra confirmation
  requiresMfa: boolean('requires_mfa').default(false).notNull(), // MFA required to use
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('idx_permissions_code').on(table.code),
  moduleIdx: index('idx_permissions_module').on(table.module),
  dangerousIdx: index('idx_permissions_dangerous').on(table.isDangerous),
}));

// Roles can be global (system) or tenant-specific - aligned with core.sql
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  parentRoleId: uuid('parent_role_id'), // For hierarchical roles
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  priority: integer('priority').default(0).notNull(), // 0-100
  color: varchar('color', { length: 7 }), // Hex color
  maxUsers: integer('max_users'),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, inactive, deprecated
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_roles_tenant').on(table.tenantId),
  codeIdx: index('idx_roles_code').on(table.code),
  statusIdx: index('idx_roles_status').on(table.status),
  parentIdx: index('idx_roles_parent').on(table.parentRoleId),
  priorityIdx: index('idx_roles_priority').on(table.priority),
  tenantCodeUnique: unique('roles_tenant_code_unique').on(table.tenantId, table.code),
}));

// User-Role assignments (many-to-many with temporal access) - from core.sql
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
  validFrom: timestamp('valid_from').defaultNow(),
  validUntil: timestamp('valid_until'),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').default({}),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_user_roles_user').on(table.userId),
  roleIdx: index('idx_user_roles_role').on(table.roleId),
  tenantIdx: index('idx_user_roles_tenant').on(table.tenantId),
  temporalIdx: index('idx_user_roles_temporal').on(table.validFrom, table.validUntil),
  userRoleTenantUnique: unique('user_roles_user_role_tenant_unique').on(table.userId, table.roleId, table.tenantId),
}));

// Mapping between roles and permissions with conditions
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  conditions: jsonb('conditions'),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
}, (table) => ({
  roleIdx: index('idx_role_permissions_role').on(table.roleId),
  permissionIdx: index('idx_role_permissions_permission').on(table.permissionId),
  conditionsIdx: index('idx_role_permissions_conditions').on(table.conditions),
  rolePermissionUnique: unique('role_permissions_role_permission_unique').on(table.roleId, table.permissionId),
}));

// Resource-level permissions (object-level access control) - from core.sql
export const resourcePermissions = pgTable('resource_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id').notNull(),
  permissionCode: varchar('permission_code', { length: 100 }).notNull(),
  grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
  validFrom: timestamp('valid_from').defaultNow(),
  validUntil: timestamp('valid_until'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_resource_permissions_user').on(table.userId),
  resourceIdx: index('idx_resource_permissions_resource').on(table.resourceType, table.resourceId),
  temporalIdx: index('idx_resource_permissions_temporal').on(table.validFrom, table.validUntil),
  userResourcePermUnique: unique('resource_permissions_unique').on(table.userId, table.resourceType, table.resourceId, table.permissionCode),
}));

// Sessions (track active user sessions) - from core.sql
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  lastActivity: timestamp('last_activity').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_sessions_user').on(table.userId),
  expiresIdx: index('idx_sessions_expires').on(table.expiresAt),
  activityIdx: index('idx_sessions_activity').on(table.lastActivity),
}));

// ============================================================================
// 3. MULTI-TENANT SUPPORT
// ============================================================================

// Tenants (organizations / companies) - aligned with core.sql
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  settings: jsonb('settings').default({}),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, suspended, archived, trial
  plan: varchar('plan', { length: 50 }).default('free').notNull(), // free, starter, pro, enterprise
  maxUsers: integer('max_users').default(10),
  trialEndsAt: timestamp('trial_ends_at'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  slugIdx: index('idx_tenants_slug').on(table.slug),
  statusIdx: index('idx_tenants_status').on(table.status),
  planIdx: index('idx_tenants_plan').on(table.plan),
}));

// Track which user belongs to which tenant
export const tenantUsers = pgTable('tenant_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
  isPrimary: boolean('is_primary').default(false).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_tenant_users_tenant').on(table.tenantId),
  userIdx: index('idx_tenant_users_user').on(table.userId),
  tenantUserUnique: unique('tenant_users_tenant_user_unique').on(table.tenantId, table.userId),
}));

// ============================================================================
// 4. AUDIT LOG
// ============================================================================

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  tenantId: uuid('tenant_id'),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: uuid('resource_id'),
  changes: jsonb('changes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_audit_logs_user').on(table.userId),
  tenantIdx: index('idx_audit_logs_tenant').on(table.tenantId),
  resourceIdx: index('idx_audit_logs_resource').on(table.resourceType, table.resourceId),
  createdIdx: index('idx_audit_logs_created').on(table.createdAt),
}));

// ============================================================================
// 5. SYSTEM SETTINGS
// ============================================================================

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  settingKey: text('setting_key').notNull(),
  settingValue: text('setting_value').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  autoload: boolean('autoload').default(true).notNull(),
  dataType: text('data_type').default('string'),
  description: text('description'),
  isSensitive: boolean('is_sensitive').default(false).notNull(),
}, (table) => ({
  settingKeyUnique: unique('system_settings_key_unique').on(table.settingKey),
  categoryIdx: index('idx_system_settings_category').on(table.category),
  autoloadIdx: index('idx_system_settings_autoload').on(table.autoload),
  categorySubcategoryIdx: index('idx_system_settings_category_subcategory').on(table.category, table.subcategory),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  authProviders: many(authProviders),
  refreshTokens: many(refreshTokens),
  accessTokens: many(accessTokens),
  passwordResetTokens: many(passwordResetTokens),
  tenantUsers: many(tenantUsers),
  userRoles: many(userRoles),
  resourcePermissions: many(resourcePermissions),
  sessions: many(sessions),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  // Modules are now just organizational units, not directly linked to permissions
}));

export const permissionGroupsRelations = relations(permissionGroups, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [permissionGroups.tenantId],
    references: [tenants.id],
  }),
  items: many(permissionGroupItems),
}));

export const permissionGroupItemsRelations = relations(permissionGroupItems, ({ one }) => ({
  group: one(permissionGroups, {
    fields: [permissionGroupItems.groupId],
    references: [permissionGroups.id],
  }),
  permission: one(permissions, {
    fields: [permissionGroupItems.permissionId],
    references: [permissions.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  groupItems: many(permissionGroupItems),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  parentRole: one(roles, {
    fields: [roles.parentRoleId],
    references: [roles.id],
  }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
  tenantUsers: many(tenantUsers),
  childRoles: many(roles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  tenant: one(tenants, {
    fields: [userRoles.tenantId],
    references: [tenants.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [sessions.tenantId],
    references: [tenants.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  tenantUsers: many(tenantUsers),
  userRoles: many(userRoles),
  resourcePermissions: many(resourcePermissions),
  sessions: many(sessions),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [tenantUsers.roleId],
    references: [roles.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthProvider = typeof authProviders.$inferSelect;
export type NewAuthProvider = typeof authProviders.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type AccessToken = typeof accessTokens.$inferSelect;
export type NewAccessToken = typeof accessTokens.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type ModuleLabel = typeof moduleLabels.$inferSelect;
export type NewModuleLabel = typeof moduleLabels.$inferInsert;
export type PermissionGroup = typeof permissionGroups.$inferSelect;
export type NewPermissionGroup = typeof permissionGroups.$inferInsert;
export type PermissionGroupItem = typeof permissionGroupItems.$inferSelect;
export type NewPermissionGroupItem = typeof permissionGroupItems.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type ResourcePermission = typeof resourcePermissions.$inferSelect;
export type NewResourcePermission = typeof resourcePermissions.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type NewTenantUser = typeof tenantUsers.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
