import { db } from '@/core/lib/db';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { eq, and, or } from 'drizzle-orm';
import { ORDER_PERMISSIONS } from '../config/permissions.config';
import { ORDER_FIELDS } from '../config/fields.config';

const MODULE_CODE = 'ORDERS';

/**
 * Register permissions for the orders module
 */
export async function registerOrderPermissions(userId?: string): Promise<void> {
  // Try both uppercase and lowercase module codes
  const moduleRecord = await db
    .select()
    .from(modules)
    .where(or(eq(modules.code, MODULE_CODE), eq(modules.code, MODULE_CODE.toLowerCase())))
    .limit(1);

  if (moduleRecord.length === 0) {
    console.warn(`Module ${MODULE_CODE} not found. Permissions will be registered when module is created.`);
    return;
  }

  const existingPermissions = await db.select().from(permissions);
  const existingPermissionCodes = new Set(existingPermissions.map((p) => p.code));

  const permissionsToInsert = ORDER_PERMISSIONS.filter(
    (perm) => !existingPermissionCodes.has(perm.code),
  ).map((perm) => ({
    code: perm.code,
    name: perm.name,
    module: 'orders',
    resource: 'orders',
    action: perm.action,
    description: perm.description,
    isDangerous: perm.isDangerous,
    requiresMfa: perm.requiresMfa,
    isActive: true,
    metadata: {},
  }));

  if (permissionsToInsert.length > 0) {
    await db.insert(permissions).values(permissionsToInsert);
    console.log(`✅ Registered ${permissionsToInsert.length} permissions for ${MODULE_CODE}`);
  }
}

/**
 * Register system fields for the orders module
 */
export async function registerOrderFields(userId?: string): Promise<void> {
  // Try both uppercase and lowercase module codes
  const moduleRecord = await db
    .select()
    .from(modules)
    .where(or(eq(modules.code, MODULE_CODE), eq(modules.code, MODULE_CODE.toLowerCase())))
    .limit(1);

  if (moduleRecord.length === 0) {
    console.warn(`Module ${MODULE_CODE} not found. Fields will be registered when module is created.`);
    return;
  }

  const moduleId = moduleRecord[0].id;

  const existingFields = await db
    .select()
    .from(moduleFields)
    .where(eq(moduleFields.moduleId, moduleId));

  const existingFieldCodes = new Set(existingFields.map((f) => f.code));

  const fieldsToInsert = ORDER_FIELDS.filter((field) => !existingFieldCodes.has(field.code)).map(
    (field) => ({
      moduleId,
      name: field.name,
      code: field.code,
      label: field.label,
      fieldType: field.fieldType,
      description: field.description || null,
      isSystemField: true, // CRITICAL: Mark as system field
      isActive: true,
      sortOrder: field.sortOrder,
      createdBy: userId || null,
      updatedBy: userId || null,
    }),
  );

  if (fieldsToInsert.length > 0) {
    await db.insert(moduleFields).values(fieldsToInsert);
    console.log(`✅ Registered ${fieldsToInsert.length} system fields for ${MODULE_CODE}`);
  }
}

/**
 * Main registration function - registers both permissions and fields
 */
export async function registerOrderModule(userId?: string): Promise<void> {
  await registerOrderPermissions(userId);
  await registerOrderFields(userId);
}

