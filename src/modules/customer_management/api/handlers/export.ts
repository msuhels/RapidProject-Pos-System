import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { listCustomers } from '../../services/customerService';
import { CUSTOMER_FIELDS } from '../../config/fields.config';
import { db } from '@/core/lib/db';
import { modules } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
    }

    // Check permission
    const hasPermission = await userHasPermission(userId, 'customer_management:export') ||
      await userHasPermission(userId, 'customer_management:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get all customers
    const customers = await listCustomers(tenantId, {});

    // Get custom fields that should be shown in table
    const moduleRecord = await db
      .select()
      .from(modules)
      .where(eq(modules.code, 'CUSTOMER_MANAGEMENT'))
      .limit(1);

    let customFields: Array<{ code: string; label: string }> = [];
    if (moduleRecord.length > 0) {
      const fields = await db
        .select()
        .from(moduleFields)
        .where(
          and(
            eq(moduleFields.moduleId, moduleRecord[0].id),
            eq(moduleFields.isSystemField, false),
            eq(moduleFields.isActive, true),
          ),
        );

      customFields = fields
        .filter((f) => (f as any).metadata?.showInTable === true)
        .map((f) => ({ code: f.code, label: f.label || f.name }));
    }

    // Build CSV headers
    const systemHeaders = CUSTOMER_FIELDS.map((f) => f.label);
    const customHeaders = customFields.map((f) => f.label);
    const headers = [...systemHeaders, ...customHeaders];

    // Build CSV rows
    const rows = customers.map((customer) => {
      const systemValues = [
        customer.name,
        customer.phoneNumber || '',
        customer.email || '',
        customer.totalPurchases.toString(),
        customer.outstandingBalance.toString(),
        customer.isActive ? 'Yes' : 'No',
      ];

      const customValues = customFields.map((field) => {
        const value = customer.customFields?.[field.code];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value instanceof Date) return value.toISOString();
        return String(value);
      });

      return [...systemValues, ...customValues];
    });

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Customer export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

