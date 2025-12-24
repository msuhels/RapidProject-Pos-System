/**
 * Database Seed Script - Dynamic RBAC System
 * 
 * This seed script implements a fully dynamic Role-Based Access Control (RBAC) system
 * that automatically discovers and registers modules from the filesystem.
 * 
 * Key Features:
 * 1. Dynamic Module Discovery: Automatically scans src/modules/ directory
 * 2. Dynamic Permission Generation: Creates permissions based on module.config.json
 * 3. Core + Dynamic Modules: Supports both core system modules and custom modules
 * 4. Navigation Integration: Discovered modules appear in the sidebar automatically
 * 
 * How it works:
 * - Core modules (Dashboard, Users, Roles, Profile) are always included
 * - Custom modules in src/modules/ are discovered via moduleLoader
 * - Each module's permissions are generated from its module.config.json
 * - Modules are saved to the database and linked to permissions
 * - Navigation API reads from database to show all available modules
 * 
 * To add a new module:
 * 1. Create a folder in src/modules/your-module/
 * 2. Add module.config.json with permissions defined
 * 3. Run npm run seed - your module will be automatically discovered!
 * 4. The module will appear in navigation and permission assignment UI
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables FIRST before importing db
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

let loaded = false;
let lastError: Error | null = null;

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath, override: true });
    if (!result.error) {
      loaded = true;
      console.log(`✓ Loaded environment variables from ${path.basename(envPath)}`);
      if (process.env.DATABASE_URL) {
        const dbUrl = process.env.DATABASE_URL;
        const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
        console.log(`✓ DATABASE_URL found: ${maskedUrl.substring(0, 50)}...`);
      }
      break;
    } else {
      lastError = result.error;
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('\n❌ DATABASE_URL not found in environment variables\n');
  console.error('   Tried loading from:');
  envPaths.forEach((p) => {
    const exists = fs.existsSync(p) ? '✓ exists' : '✗ not found';
    console.error(`   - ${path.basename(p)} ${exists}`);
  });
  if (lastError) {
    console.error(`\n   Error: ${lastError.message}`);
  }
  console.error('\n   📝 Setup Instructions:');
  console.error('   1. Ensure .env or .env.local exists in project root');
  console.error('   2. Add DATABASE_URL to the file:');
  console.error('      DATABASE_URL=postgresql://user:password@host:port/database');
  console.error('   3. Run the seed command again:');
  console.error('      npm run seed\n');
  process.exit(1);
}

import { eq, and, isNull } from 'drizzle-orm';

/**
 * Comprehensive seed file aligned with core.sql RBAC schema
 * Implements proper module:action permission codes
 * Run with: npm run seed
 */
async function seed() {
  const { db } = await import('../src/core/lib/db');
  const {
    roles,
    permissions,
    modules,
    rolePermissions,
    tenants,
    users,
    userRoles,
    authProviders,
  } = await import('../src/core/lib/db/baseSchema');
  const { moduleFields, roleModuleAccess } = await import('../src/core/lib/db/permissionSchema');
  const { hashPassword } = await import('../src/core/lib/utils');

  console.log('🌱 Starting database seed (aligned with core.sql)...\n');

  try {
    // ============================================================================
    // 1. TENANTS (Must be first - referenced by users and roles)
    // ============================================================================
    console.log('🏢 Seeding default tenant...');
    const tenantData = [
      {
        name: 'Default Organization',
        slug: 'default',
        status: 'active',
        plan: 'free',
        maxUsers: 100,
        settings: { theme: 'light', timezone: 'UTC' },
        metadata: {},
      },
    ];

    const existingTenants = await db.select().from(tenants);
    const existingSlugs = new Set(existingTenants.map((t) => t.slug));
    const tenantsToInsert = tenantData.filter((t) => !existingSlugs.has(t.slug));

    let seededTenants = [...existingTenants];

    if (tenantsToInsert.length > 0) {
      const newTenants = await db.insert(tenants).values(tenantsToInsert).returning();
      seededTenants = [...seededTenants, ...newTenants];
      console.log(`✅ Created default tenant: "${newTenants[0].name}"`);
    } else {
      const defaultTenant = existingTenants.find((t) => t.slug === 'default');
      if (defaultTenant) {
        console.log(`ℹ️  Default tenant already exists: "${defaultTenant.name}"`);
      } else {
        console.log(`ℹ️  ${existingTenants.length} tenant(s) exist`);
      }
    }
    console.log('');

    // ============================================================================
    // 2. MODULES (Dynamically discovered from filesystem + core modules)
    // ============================================================================
    console.log('📦 Seeding modules...');
    
    // Core modules (always present)
    const coreModuleData = [
      {
        name: 'Dashboard',
        code: 'DASHBOARD',
        description: 'Main dashboard and overview',
        icon: 'LayoutDashboard',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Profile',
        code: 'PROFILE',
        description: 'User profile management',
        icon: 'User',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'User Management',
        code: 'USERS',
        description: 'Manage users',
        icon: 'Users',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: 'Role Management',
        code: 'ROLES',
        description: 'Manage roles and their permissions',
        icon: 'Shield',
        sortOrder: 4,
        isActive: true,
      },
      {
        name: 'Settings',
        code: 'SETTINGS',
        description: 'System settings and configuration',
        icon: 'Settings',
        sortOrder: 5,
        isActive: true,
      },
    ];

    // Discover dynamic modules from src/modules directory
    const { discoverModules, loadModuleConfig } = await import('../src/core/lib/moduleLoader');
    const discoveredModuleIds = discoverModules();
    console.log(`   Found ${discoveredModuleIds.length} dynamic module(s): ${discoveredModuleIds.join(', ')}`);

    const dynamicModuleData = [];
    let maxSortOrder = Math.max(...coreModuleData.map(m => m.sortOrder), 0);

    for (const moduleId of discoveredModuleIds) {
      const config = loadModuleConfig(moduleId);
      if (config && config.enabled !== false) {
        maxSortOrder++;
        dynamicModuleData.push({
          name: config.name,
          code: config.id.toUpperCase(),
          description: config.description || null,
          icon: config.navigation?.icon || 'Box',
          sortOrder: config.navigation?.order || maxSortOrder,
          isActive: true,
        });
      }
    }

    // Combine core and dynamic modules
    const moduleData = [...coreModuleData, ...dynamicModuleData];

    const existingModules = await db.select().from(modules);
    const existingModuleCodes = new Set(existingModules.map((m) => m.code));
    const modulesToInsert = moduleData.filter((m) => !existingModuleCodes.has(m.code));

    let seededModules = [...existingModules];

    if (modulesToInsert.length > 0) {
      const newModules = await db.insert(modules).values(modulesToInsert).returning();
      seededModules = [...seededModules, ...newModules];
      console.log(`✅ Created ${newModules.length} new modules (${existingModules.length} already existed)`);
      console.log(`   Core modules: ${coreModuleData.length}, Dynamic modules: ${dynamicModuleData.length}`);
    } else {
      console.log(`ℹ️  All modules already exist (${existingModules.length} total)`);
    }
    console.log('');

    // ============================================================================
    // 2B. MODULE FIELDS (for field-level permissions)
    // ============================================================================
    console.log('🧩 Seeding module fields...');
    const moduleByCode = new Map(seededModules.map((m) => [m.code, m]));

    type ModuleFieldSeed = {
      name: string;
      code: string;
      label: string;
      fieldType: string;
      description?: string | null;
      sortOrder: number;
    };

    const moduleFieldDefinitions: Record<string, ModuleFieldSeed[]> = {
      // Core module fields derived from schema expectations
      USERS: [
        { name: 'Full Name', code: 'full_name', label: 'Full Name', fieldType: 'text', description: 'User full name', sortOrder: 1 },
        { name: 'Email', code: 'email', label: 'Email', fieldType: 'email', description: 'Primary login email', sortOrder: 2 },
        { name: 'Job Title', code: 'job_title', label: 'Job Title', fieldType: 'text', description: 'Role or title', sortOrder: 3 },
        { name: 'Department', code: 'department', label: 'Department', fieldType: 'text', description: 'Department or team', sortOrder: 4 },
        { name: 'Phone Number', code: 'phone_number', label: 'Phone Number', fieldType: 'text', description: 'Contact phone', sortOrder: 5 },
        { name: 'Status', code: 'status', label: 'Status', fieldType: 'text', description: 'Account status', sortOrder: 6 },
        { name: 'Locale', code: 'locale', label: 'Locale', fieldType: 'text', description: 'Preferred locale', sortOrder: 7 },
        { name: 'Timezone', code: 'timezone', label: 'Timezone', fieldType: 'text', description: 'Preferred timezone', sortOrder: 8 },
        { name: 'Email Verified', code: 'email_verified', label: 'Email Verified', fieldType: 'boolean', description: 'Whether email is verified', sortOrder: 9 },
        { name: 'Two Factor Enabled', code: 'two_factor_enabled', label: 'Two Factor Enabled', fieldType: 'boolean', description: '2FA status', sortOrder: 10 },
        { name: 'Last Login At', code: 'last_login_at', label: 'Last Login At', fieldType: 'datetime', description: 'Most recent login', sortOrder: 11 },
        { name: 'Created At', code: 'created_at', label: 'Created At', fieldType: 'datetime', description: 'Record creation time', sortOrder: 98 },
        { name: 'Updated At', code: 'updated_at', label: 'Updated At', fieldType: 'datetime', description: 'Record update time', sortOrder: 99 },
      ],
      ROLES: [
        { name: 'Role Name', code: 'name', label: 'Role Name', fieldType: 'text', description: 'Display name of the role', sortOrder: 1 },
        { name: 'Role Code', code: 'code', label: 'Role Code', fieldType: 'text', description: 'Unique role identifier', sortOrder: 2 },
        { name: 'Description', code: 'description', label: 'Description', fieldType: 'text', description: 'What this role is for', sortOrder: 3 },
        { name: 'Priority', code: 'priority', label: 'Priority', fieldType: 'number', description: 'Role precedence (0-100)', sortOrder: 4 },
        { name: 'Status', code: 'status', label: 'Status', fieldType: 'text', description: 'Active/Inactive/Deprecated', sortOrder: 5 },
        { name: 'Color', code: 'color', label: 'Color', fieldType: 'text', description: 'Badge color (hex)', sortOrder: 6 },
        { name: 'System Role', code: 'is_system', label: 'System Role', fieldType: 'boolean', description: 'System-managed role', sortOrder: 7 },
        { name: 'Default Role', code: 'is_default', label: 'Default Role', fieldType: 'boolean', description: 'Assigned by default', sortOrder: 8 },
        { name: 'Created At', code: 'created_at', label: 'Created At', fieldType: 'datetime', description: 'Record creation time', sortOrder: 98 },
        { name: 'Updated At', code: 'updated_at', label: 'Updated At', fieldType: 'datetime', description: 'Record update time', sortOrder: 99 },
      ],
      PRODUCTS: [
        { name: 'Name', code: 'name', label: 'Product Name', fieldType: 'text', description: 'Product name', sortOrder: 1 },
        { name: 'Price', code: 'price', label: 'Price', fieldType: 'text', description: 'Product price', sortOrder: 2 },
        { name: 'CostPrice', code: 'costPrice', label: 'Cost Price', fieldType: 'number', description: 'Product cost price', sortOrder: 3 },
        { name: 'SellingPrice', code: 'sellingPrice', label: 'Selling Price', fieldType: 'number', description: 'Product selling price', sortOrder: 4 },
        { name: 'TaxRate', code: 'taxRate', label: 'Tax Rate', fieldType: 'number', description: 'Tax rate percentage', sortOrder: 5 },
        { name: 'Quantity', code: 'quantity', label: 'Stock Quantity', fieldType: 'text', description: 'Product quantity', sortOrder: 6 },
        { name: 'Image', code: 'image', label: 'Image URL', fieldType: 'url', description: 'Product image URL', sortOrder: 7 },
        { name: 'Category', code: 'category', label: 'Category', fieldType: 'text', description: 'Product category', sortOrder: 8 },
        { name: 'SKU', code: 'sku', label: 'SKU / Barcode', fieldType: 'text', description: 'Stock keeping unit', sortOrder: 9 },
        { name: 'Location', code: 'location', label: 'Location', fieldType: 'text', description: 'Inventory storage location', sortOrder: 10 },
        { name: 'Status', code: 'status', label: 'Status', fieldType: 'select', description: 'Inventory status (In Stock, Low Stock, Out of Stock)', sortOrder: 11 },
      ],
      CARTS: [
        { name: 'Product', code: 'product', label: 'Product', fieldType: 'text', description: 'Product details (name, image, price)', sortOrder: 1 },
        { name: 'Quantity', code: 'quantity', label: 'Quantity', fieldType: 'text', description: 'Product quantity in cart', sortOrder: 2 },
        { name: 'User ID', code: 'userId', label: 'User ID', fieldType: 'text', description: 'Reference to user', sortOrder: 3 },
      ],
      INVENTORY: [
        { name: 'Product Name', code: 'name', label: 'Product Name', fieldType: 'text', description: 'Product name', sortOrder: 1 },
        { name: 'SKU', code: 'sku', label: 'SKU', fieldType: 'text', description: 'Stock keeping unit', sortOrder: 2 },
        { name: 'Location', code: 'location', label: 'Location', fieldType: 'text', description: 'Inventory storage location', sortOrder: 3 },
        { name: 'Quantity', code: 'quantity', label: 'Quantity', fieldType: 'number', description: 'Quantity on hand', sortOrder: 4 },
        { name: 'Status', code: 'status', label: 'Status', fieldType: 'select', description: 'Inventory status (In Stock, Low Stock, Out of Stock)', sortOrder: 5 },
        { name: 'Price', code: 'price', label: 'Price', fieldType: 'text', description: 'Product price', sortOrder: 6 },
      ],
    };

    for (const [moduleCode, fields] of Object.entries(moduleFieldDefinitions)) {
      const moduleRecord = moduleByCode.get(moduleCode);

      if (!moduleRecord) {
        console.log(`ℹ️  ${moduleCode} module not found - skipping module_fields seeding for it`);
        continue;
      }

      const existingFields = await db
        .select()
        .from(moduleFields)
        .where(eq(moduleFields.moduleId, moduleRecord.id));

      const existingFieldCodes = new Set(existingFields.map((f) => f.code));
      const fieldsToInsert = fields
        .filter((f) => !existingFieldCodes.has(f.code))
        .map((f) => ({
          ...f,
          moduleId: moduleRecord.id,
        }));

      if (fieldsToInsert.length > 0) {
        await db.insert(moduleFields).values(fieldsToInsert);
        console.log(`✅ Added ${fieldsToInsert.length} field(s) to ${moduleRecord.name} module`);
      } else {
        console.log(`ℹ️  ${moduleRecord.name} module fields already exist`);
      }
    }
    console.log('');

    // ============================================================================
    // 3. PERMISSIONS (module:action format - dynamically generated)
    // ============================================================================
    console.log('🔐 Seeding permissions (module:action format)...');
    
    // Core permissions for core modules
    const corePermissions = [
      // User Management Permissions
      { code: 'users:create', name: 'Create User', module: 'users', action: 'create', resource: 'user', isDangerous: false, requiresMfa: false, description: 'Create new users' },
      { code: 'users:read', name: 'View Users', module: 'users', action: 'read', resource: 'user', isDangerous: false, requiresMfa: false, description: 'View user details' },
      { code: 'users:update', name: 'Edit User', module: 'users', action: 'update', resource: 'user', isDangerous: false, requiresMfa: false, description: 'Modify user information' },
      { code: 'users:delete', name: 'Delete User', module: 'users', action: 'delete', resource: 'user', isDangerous: true, requiresMfa: true, description: 'Remove users from system' },
      { code: 'users:manage', name: 'Manage Users', module: 'users', action: 'manage', resource: 'user', isDangerous: false, requiresMfa: false, description: 'Full user management capabilities' },
      { code: 'users:*', name: 'All User Permissions', module: 'users', action: 'manage', resource: 'user', isDangerous: true, requiresMfa: false, description: 'Wildcard - all user permissions' },
      
      // Role Management Permissions
      { code: 'roles:create', name: 'Create Role', module: 'roles', action: 'create', resource: 'role', isDangerous: false, requiresMfa: false, description: 'Create new roles' },
      { code: 'roles:read', name: 'View Roles', module: 'roles', action: 'read', resource: 'role', isDangerous: false, requiresMfa: false, description: 'View role details' },
      { code: 'roles:update', name: 'Edit Role', module: 'roles', action: 'update', resource: 'role', isDangerous: false, requiresMfa: false, description: 'Modify role information' },
      { code: 'roles:delete', name: 'Delete Role', module: 'roles', action: 'delete', resource: 'role', isDangerous: true, requiresMfa: false, description: 'Remove roles' },
      { code: 'roles:assign', name: 'Assign Roles', module: 'roles', action: 'execute', resource: 'user_role', isDangerous: false, requiresMfa: false, description: 'Assign roles to users' },
      { code: 'roles:*', name: 'All Role Permissions', module: 'roles', action: 'manage', resource: 'role', isDangerous: true, requiresMfa: false, description: 'Wildcard - all role permissions' },
      
      // Dashboard Permissions
      { code: 'dashboard:read', name: 'View Dashboard', module: 'dashboard', action: 'read', resource: 'dashboard', isDangerous: false, requiresMfa: false, description: 'View dashboard' },
      
      // Profile Permissions
      { code: 'profile:read', name: 'View Profile', module: 'profile', action: 'read', resource: 'profile', isDangerous: false, requiresMfa: false, description: 'View own profile' },
      { code: 'profile:update', name: 'Update Profile', module: 'profile', action: 'update', resource: 'profile', isDangerous: false, requiresMfa: false, description: 'Update own profile' },
      
      // Settings Permissions (Main)
      { code: 'settings:read', name: 'View Settings', module: 'settings', action: 'read', resource: 'settings', isDangerous: false, requiresMfa: false, description: 'View settings' },
      { code: 'settings:update', name: 'Update Settings', module: 'settings', action: 'update', resource: 'settings', isDangerous: false, requiresMfa: false, description: 'Update settings' },
      { code: 'settings:*', name: 'All Settings Permissions', module: 'settings', action: 'manage', resource: 'settings', isDangerous: false, requiresMfa: false, description: 'Wildcard - all settings permissions' },
      
      // Settings Submenu Permissions - General
      { code: 'settings:general:read', name: 'View General Settings', module: 'settings', action: 'read', resource: 'settings_general', isDangerous: false, requiresMfa: false, description: 'View general settings' },
      { code: 'settings:general:update', name: 'Update General Settings', module: 'settings', action: 'update', resource: 'settings_general', isDangerous: false, requiresMfa: false, description: 'Update general settings' },
      
      // Settings Submenu Permissions - Registration
      { code: 'settings:registration:read', name: 'View Registration Settings', module: 'settings', action: 'read', resource: 'settings_registration', isDangerous: false, requiresMfa: false, description: 'View registration settings' },
      { code: 'settings:registration:update', name: 'Update Registration Settings', module: 'settings', action: 'update', resource: 'settings_registration', isDangerous: false, requiresMfa: false, description: 'Update registration settings' },
      
      // Settings Submenu Permissions - Notification Methods
      { code: 'settings:notification-methods:read', name: 'View Notification Methods', module: 'settings', action: 'read', resource: 'settings_notification_methods', isDangerous: false, requiresMfa: false, description: 'View notification methods settings' },
      { code: 'settings:notification-methods:update', name: 'Update Notification Methods', module: 'settings', action: 'update', resource: 'settings_notification_methods', isDangerous: false, requiresMfa: false, description: 'Update notification methods settings' },
      
      // Settings Submenu Permissions - SMTP Settings
      { code: 'settings:smtp-settings:read', name: 'View SMTP Settings', module: 'settings', action: 'read', resource: 'settings_smtp', isDangerous: false, requiresMfa: false, description: 'View SMTP settings' },
      { code: 'settings:smtp-settings:update', name: 'Update SMTP Settings', module: 'settings', action: 'update', resource: 'settings_smtp', isDangerous: true, requiresMfa: true, description: 'Update SMTP settings (sensitive)' },
      
      // Settings Submenu Permissions - Custom Fields
      { code: 'settings:custom-fields:read', name: 'View Custom Fields', module: 'settings', action: 'read', resource: 'settings_custom_fields', isDangerous: false, requiresMfa: false, description: 'View custom fields settings' },
      { code: 'settings:custom-fields:update', name: 'Update Custom Fields', module: 'settings', action: 'update', resource: 'settings_custom_fields', isDangerous: false, requiresMfa: false, description: 'Update custom fields settings' },
      
      // System Permissions
      { code: 'system:*', name: 'System Administrator', module: 'system', action: 'manage', resource: null, isDangerous: true, requiresMfa: true, description: 'Full system access' },
      
      // Admin Wildcard (grants everything)
      { code: 'admin:*', name: 'Super Admin (All)', module: 'admin', action: 'manage', resource: null, isDangerous: true, requiresMfa: true, description: 'Wildcard - grants all permissions' },
    ];

    // Generate permissions for dynamic modules
    // For consistency, we seed ALL discovered modules based on their
    // module.config.json permissions. Modules with their own registration will
    // simply be de-duplicated by existingPermissionCodes.
    const dynamicPermissions = [];
    for (const moduleId of discoveredModuleIds) {
      const config = loadModuleConfig(moduleId);
      if (config && config.enabled !== false && config.permissions) {
        const moduleName = config.id.toLowerCase();
        const moduleDisplayName = config.name;

        // If module has custom permissions defined, use them
        if (typeof config.permissions === 'object') {
          for (const [action, code] of Object.entries(config.permissions)) {
            dynamicPermissions.push({
              code: code as string,
              name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${moduleDisplayName}`,
              module: moduleName,
              action: action,
              resource: moduleName,
              isDangerous: action === 'delete',
              requiresMfa: false,
              description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${moduleDisplayName.toLowerCase()}`,
            });
          }
        }
        
        // Always add wildcard permission for the module
        dynamicPermissions.push({
          code: `${moduleName}:*`,
          name: `All ${moduleDisplayName} Permissions`,
          module: moduleName,
          action: 'manage',
          resource: moduleName,
          isDangerous: true,
          requiresMfa: false,
          description: `Wildcard - all ${moduleDisplayName.toLowerCase()} permissions`,
        });
      }
    }

    // Deduplicate permissions by code (module.config may already include a wildcard we also add)
    const permissionDataAll = [...corePermissions, ...dynamicPermissions];
    const permissionMap = new Map<string, typeof permissionDataAll[number]>();
    for (const perm of permissionDataAll) {
      if (!permissionMap.has(perm.code)) {
        permissionMap.set(perm.code, perm);
      }
    }

    const permissionData = Array.from(permissionMap.values());

    console.log(
      `   Generated ${corePermissions.length} core permissions + ${dynamicPermissions.length} dynamic permissions (deduped to ${permissionData.length} total)`,
    );

    const existingPermissions = await db.select().from(permissions);
    const existingPermissionCodes = new Set(existingPermissions.map((p) => p.code));
    const permissionsToInsert = permissionData.filter((p) => !existingPermissionCodes.has(p.code));

    let seededPermissions = [...existingPermissions];

    if (permissionsToInsert.length > 0) {
      const newPermissions = await db.insert(permissions).values(permissionsToInsert).returning();
      seededPermissions = [...seededPermissions, ...newPermissions];
      console.log(`✅ Created ${newPermissions.length} new permissions (${existingPermissions.length} already existed)`);
    } else {
      console.log(`ℹ️  All permissions already exist (${existingPermissions.length} total)`);
    }
    console.log('');

    // ============================================================================
    // 4. ROLES (System roles - aligned with core.sql)
    // ============================================================================
    console.log('👥 Seeding roles...');
    const roleData = [
      {
        tenantId: null, // System role
        name: 'Super Admin',
        code: 'SUPER_ADMIN',
        description: 'Full system access with all permissions. Can manage all tenants. Does not belong to any tenant.',
        isSystem: true,
        isDefault: false,
        priority: 100,
        status: 'active',
        color: '#dc2626',
        metadata: {},
      },
      {
        tenantId: null, // System role
        name: 'Tenant Admin',
        code: 'TENANT_ADMIN',
        description: 'Full tenant administration. Can manage users, roles, and all resources within their tenant.',
        isSystem: true,
        isDefault: false,
        priority: 80,
        status: 'active',
        color: '#ea580c',
        metadata: {},
      },
      {
        tenantId: null, // System role
        name: 'Manager',
        code: 'MANAGER',
        description: 'Team management capabilities. Can manage teams and users.',
        isSystem: true,
        isDefault: false,
        priority: 60,
        status: 'active',
        color: '#ca8a04',
        metadata: {},
      },
      {
        tenantId: null, // System role
        name: 'Editor',
        code: 'EDITOR',
        description: 'Content editing capabilities.',
        isSystem: true,
        isDefault: false,
        priority: 40,
        status: 'active',
        color: '#16a34a',
        metadata: {},
      },
      {
        tenantId: null, // System role
        name: 'User',
        code: 'USER',
        description: 'Standard user with basic access. Default role for new registrations.',
        isSystem: true,
        isDefault: true, // Default role for new users
        priority: 30,
        status: 'active',
        color: '#8b5cf6',
        metadata: {},
      },
      {
        tenantId: null, // System role
        name: 'Viewer',
        code: 'VIEWER',
        description: 'Read-only access to users and billing data.',
        isSystem: true,
        isDefault: false,
        priority: 20,
        status: 'active',
        color: '#2563eb',
        metadata: {},
      },
      {
        tenantId: null, // System role
        name: 'Guest',
        code: 'GUEST',
        description: 'Limited guest access.',
        isSystem: true,
        isDefault: false,
        priority: 10,
        status: 'active',
        color: '#64748b',
        metadata: {},
      },
    ];

    const existingRoles = await db.select().from(roles);
    const existingRoleCodes = new Set(existingRoles.map((r) => r.code));
    const rolesToInsert = roleData.filter((r) => !existingRoleCodes.has(r.code));

    let seededRoles = [...existingRoles];

    if (rolesToInsert.length > 0) {
      const newRoles = await db.insert(roles).values(rolesToInsert).returning();
      seededRoles = [...seededRoles, ...newRoles];
      console.log(`✅ Created ${newRoles.length} new roles (${existingRoles.length} already existed)`);
    } else {
      console.log(`ℹ️  All roles already exist (${existingRoles.length} total)`);
    }
    console.log('');

    // ============================================================================
    // 5. ROLE PERMISSIONS (Assign permissions to roles)
    // ============================================================================
    console.log('🔗 Assigning permissions to roles...');
    
    const superAdminRole = seededRoles.find((r) => r.code === 'SUPER_ADMIN')!;
    const tenantAdminRole = seededRoles.find((r) => r.code === 'TENANT_ADMIN')!;
    const managerRole = seededRoles.find((r) => r.code === 'MANAGER')!;
    const editorRole = seededRoles.find((r) => r.code === 'EDITOR')!;
    const userRole = seededRoles.find((r) => r.code === 'USER')!;
    const viewerRole = seededRoles.find((r) => r.code === 'VIEWER')!;

    const existingRolePermissions = await db.select().from(rolePermissions);
    const existingRolePermissionKeys = new Set(
      existingRolePermissions.map((rp) => `${rp.roleId}-${rp.permissionId}`)
    );

    const insertRolePermissions = async (
      role: typeof superAdminRole,
      permissionCodes: string[],
      roleName: string
    ) => {
      const permissionsToAssign = seededPermissions.filter((p) => permissionCodes.includes(p.code));
      const toInsert = permissionsToAssign
        .map((perm) => ({
          roleId: role.id,
          permissionId: perm.id,
          conditions: null,
        }))
        .filter((rp) => !existingRolePermissionKeys.has(`${rp.roleId}-${rp.permissionId}`));

      if (toInsert.length > 0) {
        await db.insert(rolePermissions).values(toInsert);
        return toInsert.length;
      }
      return 0;
    };

    // Super Admin gets ALL permissions explicitly (full system access)
    let superAdminCount = 0;
    {
      const permissionsToAssign = seededPermissions;
      const toInsert = permissionsToAssign
        .map((perm) => ({
          roleId: superAdminRole.id,
          permissionId: perm.id,
          conditions: null,
        }))
        .filter((rp) => !existingRolePermissionKeys.has(`${rp.roleId}-${rp.permissionId}`));

      if (toInsert.length > 0) {
        await db.insert(rolePermissions).values(toInsert);
        superAdminCount = toInsert.length;
      }
    }

    // Tenant Admin gets all permissions except system:* and admin:*
    const tenantAdminCount = await insertRolePermissions(
      tenantAdminRole,
      ['users:*', 'roles:*', 'billing:*', 'audit:read'],
      'Tenant Admin'
    );

    // Manager gets management permissions
    const managerCount = await insertRolePermissions(
      managerRole,
      [
        'users:read',
        'users:create',
        'users:update',
        'roles:read',
        'roles:assign',
        'billing:read',
      ],
      'Manager'
    );

    // Editor gets project editing permissions
    const editorCount = await insertRolePermissions(
      editorRole,
      ['users:read'],
      'Editor'
    );

    // User gets basic access (dashboard, profile, read own data)
    const userCount = await insertRolePermissions(
      userRole,
      ['dashboard:read', 'profile:read', 'profile:update'],
      'User'
    );

    // Viewer gets read-only permissions
    const viewerCount = await insertRolePermissions(
      viewerRole,
      ['users:read', 'billing:read'],
      'Viewer'
    );

    console.log(`✅ Assigned ${superAdminCount} new permissions to Super Admin`);
    console.log(`✅ Assigned ${tenantAdminCount} new permissions to Tenant Admin`);
    console.log(`✅ Assigned ${managerCount} new permissions to Manager`);
    console.log(`✅ Assigned ${editorCount} new permissions to Editor`);
    console.log(`✅ Assigned ${userCount} new permissions to User`);
    console.log(`✅ Assigned ${viewerCount} new permissions to Viewer\n`);

    // ============================================================================
    // 5b. ROLE MODULE ACCESS (New permission system - takes precedence over legacy)
    // ============================================================================
    console.log('🔐 Setting up new permission system (role_module_access)...');
    
    // Get all modules and roles
    const allModulesForAccess = await db.select().from(modules).where(eq(modules.isActive, true));
    const allRolesForAccess = seededRoles;
    
    // Check existing entries
    const existingModuleAccess = await db.select().from(roleModuleAccess);
    const existingAccessKeys = new Set(
      existingModuleAccess.map(ma => `${ma.roleId}-${ma.moduleId}`)
    );
    
    const moduleAccessToInsert: Array<{
      roleId: string;
      moduleId: string;
      hasAccess: boolean;
      dataAccess: 'none' | 'own' | 'team' | 'all';
    }> = [];
    
    // For each role and module combination, set default access
    for (const role of allRolesForAccess) {
      for (const module of allModulesForAccess) {
        const key = `${role.id}-${module.id}`;
        if (existingAccessKeys.has(key)) continue;
        
        let hasAccess = false;
        let dataAccess: 'none' | 'own' | 'team' | 'all' = 'none';
        
        // Super Admin: full access to all modules
        if (role.code === 'SUPER_ADMIN') {
          hasAccess = true;
          dataAccess = 'all';
        }
        // Tenant Admin: NO access by default (must be explicitly granted)
        // This ensures the new permission system takes precedence
        else if (role.code === 'TENANT_ADMIN') {
          hasAccess = false; // Explicitly set to false - Super Admin must enable
          dataAccess = 'none';
        }
        // Other roles: no access by default
        else {
          hasAccess = false;
          dataAccess = 'none';
        }
        
        moduleAccessToInsert.push({
          roleId: role.id,
          moduleId: module.id,
          hasAccess,
          dataAccess,
        });
      }
    }
    
    if (moduleAccessToInsert.length > 0) {
      await db.insert(roleModuleAccess).values(moduleAccessToInsert);
      console.log(`✅ Created ${moduleAccessToInsert.length} role-module access entries`);
      console.log(`   ℹ️  All modules are set to 'no access' by default for non-Super Admin roles`);
      console.log(`   ℹ️  Super Admin must explicitly enable access through Role Management UI\n`);
    } else {
      console.log(`ℹ️  All role-module access entries already exist\n`);
    }

    // ============================================================================
    // 6. SUPER ADMIN USER (create only if no users exist)
    // ============================================================================
    console.log('👤 Seeding Super Admin user (if none exist)...');

    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      const defaultTenant = seededTenants.find((t) => t.slug === 'default') || seededTenants[0];
      const superAdminRoleRecord = seededRoles.find((r) => r.code === 'SUPER_ADMIN');

      if (!defaultTenant || !superAdminRoleRecord) {
        console.warn(
          '⚠️  Cannot create Super Admin user: default tenant or SUPER_ADMIN role not found.'
        );
      } else {
        const superAdminEmail = process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@example.com';
        const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD || 'SuperAdmin123!';

        console.log(`   Creating Super Admin user: ${superAdminEmail}`);

        const passwordHash = await hashPassword(superAdminPassword);

        const [superAdminUser] = await db
          .insert(users)
          .values({
            email: superAdminEmail,
            passwordHash,
            fullName: 'Super Administrator',
            tenantId: defaultTenant.id,
            status: 'active',
            isEmailVerified: true,
            timezone: 'UTC',
            locale: 'en',
            metadata: {},
          })
          .returning();

        // Create auth provider entry for password auth
        await db.insert(authProviders).values({
          userId: superAdminUser.id,
          provider: 'password',
        });

        // Assign SUPER_ADMIN role via userRoles (system role, no tenant) if needed
        await db.insert(userRoles).values({
          userId: superAdminUser.id,
          roleId: superAdminRoleRecord.id,
          tenantId: defaultTenant.id,
          grantedBy: superAdminUser.id,
          isActive: true,
          metadata: {},
        });

        console.log('   ✅ Super Admin user created successfully');
        console.log('   👉 Credentials:');
        console.log(`      Email   : ${superAdminEmail}`);
        console.log(
          `      Password: ${process.env.SEED_SUPERADMIN_PASSWORD ? '(from SEED_SUPERADMIN_PASSWORD env)' : superAdminPassword
          }`
        );
      }
    } else {
      console.log('ℹ️  Users already exist - skipping Super Admin user creation');
    }
    console.log('');

    
    // ============================================================================
    // 7. MODULE-SPECIFIC SEEDS (Register module fields and custom setup)
    // ============================================================================
    console.log('🌱 Running module-specific seeds...');
    try {
      const { loadAllModuleSeeds } = await import('../src/core/lib/seedLoader');
      const moduleSeeds = await loadAllModuleSeeds();
      
      if (moduleSeeds.length > 0) {
        console.log(`   Found ${moduleSeeds.length} module seed(s) to run`);
        for (const { moduleId, seed } of moduleSeeds) {
          try {
            await seed(db);
            console.log(`   ✅ Completed seed for module: ${moduleId}`);
          } catch (error) {
            console.error(`   ❌ Failed to run seed for module ${moduleId}:`, error);
          }
        }
      } else {
        console.log('   ℹ️  No module-specific seeds found');
      }
    } catch (error) {
      console.error('   ⚠️  Error loading module seeds:', error);
    }
    console.log('');

    console.log('✨ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${seededTenants.length} tenant(s) - Default tenant for new registrations`);
    console.log(`   - ${seededModules.length} modules`);
    console.log(`   - ${seededPermissions.length} permissions (module:action format)`);
    console.log(`   - ${seededRoles.length} roles (including default "USER" role)\n`);
    
    console.log('✅ System is ready for user registration!');
    console.log('   - New users will be assigned to the "default" tenant');
    console.log('   - New users will automatically get the "USER" role');
    console.log('   - Users can register via the registration form\n');
    
    console.log('📋 Permission System:');
    console.log('   - Format: module:action (e.g., users:create)');
    console.log('   - Wildcards: users:* grants all user permissions');
    console.log('   - admin:* grants ALL permissions (Super Admin only)');
    console.log('   - Supports role hierarchy and temporal access\n');
    
    console.log('🎯 Role Structure:');
    console.log('   1. Super Admin: admin:* (everything)');
    console.log('   2. Tenant Admin: Full tenant management (users:*, roles:*, billing:*)');
    console.log('   3. Manager: Team management (users:read/create/update, roles:read/assign)');
    console.log('   4. Editor: Content editing (users:read)');
    console.log('   5. User: Basic access (dashboard, profile)');
    console.log('   6. Viewer: Read-only (users:read, billing:read)\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });