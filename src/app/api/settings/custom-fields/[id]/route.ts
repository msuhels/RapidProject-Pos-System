import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import {
  getCustomFieldById,
  updateCustomField,
  deleteCustomField,
} from '@/core/lib/services/customFieldsService';

/**
 * GET /api/settings/custom-fields/:id
 * Get a specific custom field
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const field = await getCustomFieldById(id);

    if (!field) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: field,
    });
  } catch (error) {
    console.error('Get custom field error:', error);
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
 * PATCH /api/settings/custom-fields/:id
 * Update a custom field
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const { id } = await params;
    const body = await request.json();

    const { name, label, fieldType, description, metadata, isActive, sortOrder } = body;

    const updated = await updateCustomField(
      id,
      {
        name,
        label,
        fieldType,
        description,
        metadata,
        isActive,
        sortOrder,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update custom field error:', error);
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
 * DELETE /api/settings/custom-fields/:id
 * Delete (deactivate) a custom field
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const { id } = await params;

    await deleteCustomField(id, userId);

    return NextResponse.json({
      success: true,
      message: 'Custom field deleted successfully',
    });
  } catch (error) {
    console.error('Delete custom field error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

