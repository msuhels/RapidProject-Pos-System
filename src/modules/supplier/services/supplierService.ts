import { db } from '@/core/lib/db';
import { suppliers } from '../schemas/supplierSchema';
import { eq, and, or, isNull, sql, ilike } from 'drizzle-orm';
import { modules } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import type {
  SupplierRecord,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierListFilters,
} from '../types';

export async function listSuppliers(
  tenantId: string,
  filters: SupplierListFilters = {},
): Promise<SupplierRecord[]> {
  const { search, status } = filters;

  // Build conditions array
  const conditions = [eq(suppliers.tenantId, tenantId), isNull(suppliers.deletedAt)];

  // Filter by status
  if (status) {
    conditions.push(eq(suppliers.status, status));
  }

  // Search across supplier_code, supplier_name, email, phone, and custom fields
  if (search) {
    const searchTerm = `%${search}%`;
    
    // Define searchable custom field types
    const searchableFieldTypes = ['text', 'email', 'url', 'textarea', 'select', 'number'];
    
    // Get the module
    const suppliersModule = await db
      .select()
      .from(modules)
      .where(eq(modules.code, 'SUPPLIER'))
      .limit(1);
    
    let searchConditions = [
      ilike(suppliers.supplierCode, searchTerm),
      ilike(suppliers.supplierName, searchTerm),
      ilike(suppliers.email, searchTerm),
      ilike(suppliers.phone, searchTerm),
    ];
    
    // Add custom field search if module exists
    if (suppliersModule.length > 0) {
      const customFields = await db
        .select()
        .from(moduleFields)
        .where(
          and(
            eq(moduleFields.moduleId, suppliersModule[0].id),
            eq(moduleFields.isActive, true),
            eq(moduleFields.isSystemField, false),
          ),
        );
      
      // Filter to only searchable field types
      const searchableFields = customFields.filter(field => 
        field.fieldType && searchableFieldTypes.includes(field.fieldType)
      );
      
      // Add search conditions for each searchable custom field
      for (const field of searchableFields) {
        searchConditions.push(
          sql`${suppliers.customFields}->>${field.code} ILIKE ${searchTerm}`
        );
      }
    }
    
    // Combine all search conditions with OR
    conditions.push(or(...searchConditions));
  }

  const results = await db
    .select()
    .from(suppliers)
    .where(and(...conditions))
    .orderBy(sql`${suppliers.createdAt} DESC`);

  return results.map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
    supplierCode: row.supplierCode,
    supplierName: row.supplierName,
    contactPerson: row.contactPerson,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status as 'active' | 'inactive',
    customFields: (row.customFields as Record<string, unknown>) || {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() || null,
    createdBy: row.createdBy || null,
    updatedBy: row.updatedBy || null,
  }));
}

export async function getSupplierById(
  id: string,
  tenantId: string,
): Promise<SupplierRecord | null> {
  const results = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId), isNull(suppliers.deletedAt)))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const row = results[0];
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierCode: row.supplierCode,
    supplierName: row.supplierName,
    contactPerson: row.contactPerson,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status as 'active' | 'inactive',
    customFields: (row.customFields as Record<string, unknown>) || {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() || null,
    createdBy: row.createdBy || null,
    updatedBy: row.updatedBy || null,
  };
}

export async function createSupplier(params: {
  data: CreateSupplierInput;
  tenantId: string;
  userId: string;
}): Promise<SupplierRecord> {
  const { data, tenantId, userId } = params;

  // Check for duplicate supplier code within tenant
  const existing = await db
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.tenantId, tenantId),
        eq(suppliers.supplierCode, data.supplierCode),
        isNull(suppliers.deletedAt),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Supplier code already exists for this tenant');
  }

  const [newSupplier] = await db
    .insert(suppliers)
    .values({
      tenantId,
      supplierCode: data.supplierCode,
      supplierName: data.supplierName,
      contactPerson: data.contactPerson || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      status: data.status || 'active',
      customFields: data.customFields || {},
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return {
    id: newSupplier.id,
    tenantId: newSupplier.tenantId,
    supplierCode: newSupplier.supplierCode,
    supplierName: newSupplier.supplierName,
    contactPerson: newSupplier.contactPerson,
    email: newSupplier.email,
    phone: newSupplier.phone,
    address: newSupplier.address,
    status: newSupplier.status as 'active' | 'inactive',
    customFields: (newSupplier.customFields as Record<string, unknown>) || {},
    createdAt: newSupplier.createdAt.toISOString(),
    updatedAt: newSupplier.updatedAt.toISOString(),
    deletedAt: newSupplier.deletedAt?.toISOString() || null,
    createdBy: newSupplier.createdBy || null,
    updatedBy: newSupplier.updatedBy || null,
  };
}

export async function updateSupplier(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateSupplierInput;
}): Promise<SupplierRecord | null> {
  const { id, tenantId, userId, data } = params;

  // Check for duplicate supplier code if updating code
  if (data.supplierCode) {
    const existing = await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.tenantId, tenantId),
          eq(suppliers.supplierCode, data.supplierCode),
          isNull(suppliers.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      throw new Error('Supplier code already exists for this tenant');
    }
  }

  const updateData: any = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (data.supplierCode !== undefined) updateData.supplierCode = data.supplierCode;
  if (data.supplierName !== undefined) updateData.supplierName = data.supplierName;
  if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson || null;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.address !== undefined) updateData.address = data.address || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.customFields !== undefined) {
    // Merge with existing custom fields
    const existing = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
      .limit(1);
    
    if (existing.length > 0) {
      const existingCustomFields = (existing[0].customFields as Record<string, unknown>) || {};
      updateData.customFields = { ...existingCustomFields, ...data.customFields };
    } else {
      updateData.customFields = data.customFields;
    }
  }

  const [updated] = await db
    .update(suppliers)
    .set(updateData)
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId), isNull(suppliers.deletedAt)))
    .returning();

  if (!updated) {
    return null;
  }

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    supplierCode: updated.supplierCode,
    supplierName: updated.supplierName,
    contactPerson: updated.contactPerson,
    email: updated.email,
    phone: updated.phone,
    address: updated.address,
    status: updated.status as 'active' | 'inactive',
    customFields: (updated.customFields as Record<string, unknown>) || {},
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    deletedAt: updated.deletedAt?.toISOString() || null,
    createdBy: updated.createdBy || null,
    updatedBy: updated.updatedBy || null,
  };
}

export async function deleteSupplier(
  id: string,
  tenantId: string,
  userId: string,
): Promise<boolean> {
  // Soft delete
  const [updated] = await db
    .update(suppliers)
    .set({
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId), isNull(suppliers.deletedAt)))
    .returning();

  return updated !== undefined;
}

