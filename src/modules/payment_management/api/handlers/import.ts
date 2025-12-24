import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { createPayment } from '../../services/paymentService';
import { createPaymentSchema } from '../../schemas/paymentValidation';
import { PAYMENT_FIELDS } from '../../config/fields.config';
import { db } from '@/core/lib/db';
import { modules } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { eq, and, or } from 'drizzle-orm';

function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n after \r
      }
      currentLine.push(currentField.trim());
      currentField = '';
      if (currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
      }
    } else {
      currentField += char;
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    lines.push(currentLine);
  }

  return lines;
}

export async function POST(request: NextRequest) {
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
    const hasPermission =
      (await userHasPermission(userId, 'payment_management:import')) ||
      (await userHasPermission(userId, 'payment_management:*'));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvText = await file.text();
    const lines = parseCSV(csvText);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have at least a header and one data row' },
        { status: 400 },
      );
    }

    const headers = lines[0];
    const dataRows = lines.slice(1);

    // Map headers to field codes
    const systemFieldMap = new Map<string, string>();
    PAYMENT_FIELDS.forEach((field) => {
      const headerIndex = headers.findIndex((h) => h.toLowerCase() === field.label.toLowerCase());
      if (headerIndex !== -1) {
        systemFieldMap.set(field.code, headerIndex.toString());
      }
    });

    // Get custom fields
    const moduleRecord = await db
      .select()
      .from(modules)
      .where(or(eq(modules.code, 'PAYMENT_MANAGEMENT'), eq(modules.code, 'payment_management')))
      .limit(1);

    const customFieldMap = new Map<string, { index: number; fieldType: string }>();
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

      fields.forEach((field) => {
        const headerIndex = headers.findIndex(
          (h) => h.toLowerCase() === (field.label || field.name).toLowerCase(),
        );
        if (headerIndex !== -1) {
          customFieldMap.set(field.code, { index: headerIndex, fieldType: field.fieldType || 'text' });
        }
      });
    }

    // Process rows
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row.length === 0) continue;

      try {
        const paymentData: any = {
          customFields: {},
        };

        // Map system fields
        for (const [code, indexStr] of systemFieldMap.entries()) {
          const index = parseInt(indexStr, 10);
          if (index < row.length) {
            const value = row[index];
            if (value) {
              if (code === 'amount') {
                paymentData[code] = parseFloat(value) || 0;
              } else if (code === 'is_reversed') {
                paymentData[code] = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
              } else if (code === 'payment_date') {
                paymentData[code] = value;
              } else {
                paymentData[code] = value;
              }
            }
          }
        }

        // Map custom fields
        for (const [code, { index, fieldType }] of customFieldMap.entries()) {
          if (index < row.length) {
            const value = row[index];
            if (value) {
              if (fieldType === 'number') {
                paymentData.customFields[code] = parseFloat(value) || 0;
              } else if (fieldType === 'boolean') {
                paymentData.customFields[code] = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
              } else {
                paymentData.customFields[code] = value;
              }
            }
          }
        }

        // Validate and create
        const validationResult = createPaymentSchema.safeParse(paymentData);
        if (!validationResult.success) {
          throw new Error(
            `Validation failed: ${validationResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        await createPayment({
          data: validationResult.data,
          tenantId,
          userId,
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 2, // +2 because row 1 is header, and we're 0-indexed
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          imported: results.success,
          failed: results.failed,
          errors: results.errors,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Payment import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


