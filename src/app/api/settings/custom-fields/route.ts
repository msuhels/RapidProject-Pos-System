import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { getEligibleModules, getCustomFieldsForModule, createCustomField } from '@/core/lib/services/customFieldsService';
import { db } from '@/core/lib/db';
import { modules } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/settings/custom-fields
 * List all eligible modules and their custom fields
 */
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

    const url = new URL(request.url);
    const moduleId = url.searchParams.get('moduleId');
    const search = url.searchParams.get('search') || undefined;

    if (moduleId) {
      // Get custom fields for a specific module
      const fields = await getCustomFieldsForModule(moduleId, search);
      return NextResponse.json({
        success: true,
        data: fields,
      });
    } else {
      // Get all eligible modules
      const eligibleModules = await getEligibleModules();
      
      // Get all custom fields grouped by module
      const modulesWithFields = await Promise.all(
        eligibleModules.map(async (module) => {
          const fields = await getCustomFieldsForModule(module.id);
          return {
            ...module,
            fields,
            fieldCount: fields.length,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: modulesWithFields,
      });
    }
  } catch (error) {
    console.error('Get custom fields error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/custom-fields
 * Create a new custom field
 */
export async function POST(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const body = await request.json();

    const { moduleId, name, code, label, fieldType, description, metadata, sortOrder } = body;

    if (!moduleId || !name || !code || !fieldType) {
      return NextResponse.json(
        { error: 'Missing required fields: moduleId, name, code, fieldType' },
        { status: 400 }
      );
    }

    // Validate field code format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(code)) {
      return NextResponse.json(
        { error: 'Field code must contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    const newField = await createCustomField(
      {
        moduleId,
        name,
        code,
        label,
        fieldType,
        description,
        metadata,
        sortOrder,
      },
      userId
    );

    return NextResponse.json(
      {
        success: true,
        data: newField,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create custom field error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

