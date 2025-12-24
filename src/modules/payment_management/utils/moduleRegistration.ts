import { db } from '@/core/lib/db';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { paymentMethods } from '../schemas/paymentSchema';
import { eq, or } from 'drizzle-orm';
import { PAYMENT_PERMISSIONS } from '../config/permissions.config';
import { PAYMENT_FIELDS } from '../config/fields.config';

const MODULE_CODE = 'PAYMENT_MANAGEMENT';

/**
 * Register permissions for the payment_management module
 */
export async function registerPaymentPermissions(userId?: string): Promise<void> {
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

  const permissionsToInsert = PAYMENT_PERMISSIONS.filter(
    (perm) => !existingPermissionCodes.has(perm.code),
  ).map((perm) => ({
    code: perm.code,
    name: perm.name,
    module: 'payment_management',
    resource: 'payment',
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
 * Register system fields for the payment_management module
 */
export async function registerPaymentFields(userId?: string): Promise<void> {
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

  const fieldsToInsert = PAYMENT_FIELDS.filter((field) => !existingFieldCodes.has(field.code)).map(
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
 * Register default payment methods
 */
export async function registerDefaultPaymentMethods(tenantId: string, userId?: string): Promise<void> {
  const defaultMethods = [
    { name: 'Cash', isActive: true, supportsRefund: true },
    { name: 'Card', isActive: true, supportsRefund: true },
    { name: 'UPI', isActive: true, supportsRefund: true },
  ];

  const existingMethods = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.tenantId, tenantId));

  const existingNames = new Set(existingMethods.map((m) => m.name.toLowerCase()));

  const methodsToInsert = defaultMethods
    .filter((m) => !existingNames.has(m.name.toLowerCase()))
    .map((m) => ({
      tenantId,
      name: m.name,
      isActive: m.isActive,
      supportsRefund: m.supportsRefund,
    }));

  if (methodsToInsert.length > 0) {
    await db.insert(paymentMethods).values(methodsToInsert);
    console.log(`✅ Registered ${methodsToInsert.length} default payment methods`);
  }
}

/**
 * Main registration function - registers permissions, fields, and default payment methods
 */
export async function registerPaymentModule(tenantId?: string, userId?: string): Promise<void> {
  await registerPaymentPermissions(userId);
  await registerPaymentFields(userId);
  
  // Register default payment methods for default tenant if tenantId provided
  if (tenantId) {
    await registerDefaultPaymentMethods(tenantId, userId);
  }
}

