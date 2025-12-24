import { db } from '@/core/lib/db';
import { moduleFields, roleFieldPermissions } from '@/core/lib/db/permissionSchema';
import { modules } from '@/core/lib/db/baseSchema';
import { eq, and, sql } from 'drizzle-orm';
import type { CustomFieldType, CustomFieldMetadata } from './customFieldsService';

export interface CustomFieldDefinition {
  id: string;
  code: string;
  name: string;
  label: string;
  fieldType: CustomFieldType;
  metadata?: CustomFieldMetadata;
  isVisible: boolean;
  isEditable: boolean;
}

/**
 * Get all active custom fields for a module with permission checks
 */
export async function getModuleCustomFields(
  moduleCode: string,
  roleId: string
): Promise<CustomFieldDefinition[]> {
  // Get module from database
  const module = await db
    .select()
    .from(modules)
    .where(eq(modules.code, moduleCode.toUpperCase()))
    .limit(1);

  if (module.length === 0) {
    return [];
  }

  const moduleId = module[0].id;

  // Get all active custom fields for this module
  const fields = await db
    .select()
    .from(moduleFields)
    .where(
      and(
        eq(moduleFields.moduleId, moduleId),
        eq(moduleFields.isActive, true)
      )
    )
    .orderBy(moduleFields.sortOrder);

  // Get field permissions for this role
  const fieldPermissions = await db
    .select()
    .from(roleFieldPermissions)
    .where(
      and(
        eq(roleFieldPermissions.roleId, roleId),
        eq(roleFieldPermissions.moduleId, moduleId)
      )
    );

  const permissionMap = new Map(
    fieldPermissions.map(fp => [fp.fieldId, { isVisible: fp.isVisible, isEditable: fp.isEditable }])
  );

  // Combine fields with permissions
  return fields.map(field => {
    const perm = permissionMap.get(field.id);
    return {
      id: field.id,
      code: field.code,
      name: field.name,
      label: field.label || field.name,
      fieldType: field.fieldType as CustomFieldType,
      metadata: field.description ? (JSON.parse(field.description) as CustomFieldMetadata) : undefined,
      isVisible: perm?.isVisible ?? true, // Default visible if no permission set
      isEditable: perm?.isEditable ?? false, // Default not editable if no permission set
    };
  });
}

/**
 * Validate custom field values against field definitions
 */
export function validateCustomFields(
  customFields: Record<string, unknown>,
  fieldDefinitions: CustomFieldDefinition[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of fieldDefinitions) {
    const value = customFields[field.code];

    // Check required fields
    if (field.metadata?.isRequired && (value === undefined || value === null || value === '')) {
      errors[field.code] = `${field.label} is required`;
      continue;
    }

    // Skip validation if value is empty and field is not required
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Type-specific validation
    switch (field.fieldType) {
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors[field.code] = `${field.label} must be a valid number`;
        } else {
          const numValue = Number(value);
          if (field.metadata?.validation?.min !== undefined && numValue < field.metadata.validation.min) {
            errors[field.code] = `${field.label} must be at least ${field.metadata.validation.min}`;
          }
          if (field.metadata?.validation?.max !== undefined && numValue > field.metadata.validation.max) {
            errors[field.code] = `${field.label} must be at most ${field.metadata.validation.max}`;
          }
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== 'string' || !emailRegex.test(value)) {
          errors[field.code] = `${field.label} must be a valid email address`;
        }
        break;

      case 'url':
        try {
          new URL(value as string);
        } catch {
          errors[field.code] = `${field.label} must be a valid URL`;
        }
        break;

      case 'select':
        if (field.metadata?.options && !field.metadata.options.includes(value as string)) {
          errors[field.code] = `${field.label} must be one of: ${field.metadata.options.join(', ')}`;
        }
        break;

      case 'text':
      case 'textarea':
        const strValue = String(value);
        if (field.metadata?.validation?.minLength && strValue.length < field.metadata.validation.minLength) {
          errors[field.code] = `${field.label} must be at least ${field.metadata.validation.minLength} characters`;
        }
        if (field.metadata?.validation?.maxLength && strValue.length > field.metadata.validation.maxLength) {
          errors[field.code] = `${field.label} must be at most ${field.metadata.validation.maxLength} characters`;
        }
        if (field.metadata?.validation?.pattern) {
          const pattern = new RegExp(field.metadata.validation.pattern);
          if (!pattern.test(strValue)) {
            errors[field.code] = `${field.label} format is invalid`;
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors[field.code] = `${field.label} must be true or false`;
        }
        break;

      case 'date':
        if (isNaN(Date.parse(value as string))) {
          errors[field.code] = `${field.label} must be a valid date`;
        }
        break;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Apply custom field filters to a query
 * This is a helper for building dynamic WHERE clauses for custom_fields JSONB column
 */
export function buildCustomFieldFilter(
  customFields: Record<string, unknown>,
  fieldDefinitions: CustomFieldDefinition[]
): Array<{ fieldCode: string; value: unknown; operator: 'eq' | 'contains' | 'gt' | 'lt' }> {
  const filters: Array<{ fieldCode: string; value: unknown; operator: 'eq' | 'contains' | 'gt' | 'lt' }> = [];

  for (const [fieldCode, value] of Object.entries(customFields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const fieldDef = fieldDefinitions.find(f => f.code === fieldCode);
    if (!fieldDef || !fieldDef.metadata?.isFilterable) {
      continue;
    }

    // Determine operator based on field type
    let operator: 'eq' | 'contains' | 'gt' | 'lt' = 'eq';
    if (fieldDef.fieldType === 'text' || fieldDef.fieldType === 'textarea' || fieldDef.fieldType === 'email') {
      operator = 'contains';
    } else if (fieldDef.fieldType === 'number' || fieldDef.fieldType === 'date') {
      operator = 'eq'; // Can be extended to support range queries
    }

    filters.push({ fieldCode, value, operator });
  }

  return filters;
}

/**
 * Build a PostgreSQL JSONB query condition for custom fields
 * This returns a SQL fragment that can be used in Drizzle ORM queries
 */
export function buildCustomFieldQueryCondition(
  filters: Array<{ fieldCode: string; value: unknown; operator: 'eq' | 'contains' | 'gt' | 'lt' }>
): any {
  if (filters.length === 0) {
    return undefined;
  }

  // For now, return a simple equality check
  // In a real implementation, you'd build more complex JSONB queries
  // This is a simplified version - you may need to use raw SQL for complex queries
  return filters.map(filter => {
    if (filter.operator === 'contains') {
      // Use JSONB containment or text search
      return sql`${sql.raw(`custom_fields->>'${filter.fieldCode}'`)} ILIKE ${`%${filter.value}%`}`;
    } else {
      // Equality check
      return sql`${sql.raw(`custom_fields->>'${filter.fieldCode}'`)} = ${String(filter.value)}`;
    }
  });
}

