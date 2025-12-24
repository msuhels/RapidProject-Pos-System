import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { db } from '@/core/lib/db';
import { moduleLabels, modules } from '@/core/lib/db/baseSchema';
import { getUserTenantId } from '@/core/lib/permissions';
import { eq, and } from 'drizzle-orm';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/modules/labels?moduleId=uuid
 * Returns labels for the given module id, scoped to the authenticated user's tenant
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth();
  const authResult = await auth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const userId = authResult;
  const tenantId = await getUserTenantId(userId);

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get('moduleId');

  if (!moduleId || !uuidRegex.test(moduleId)) {
    return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
  }

  try {
    const labels = await db
      .select()
      .from(moduleLabels)
      .where(
        and(
          eq(moduleLabels.moduleId, moduleId),
          eq(moduleLabels.tenantId, tenantId),
          eq(moduleLabels.isActive, true),
        ),
      )
      .orderBy(moduleLabels.sortOrder, moduleLabels.name);

    return NextResponse.json({ success: true, data: labels });
  } catch (error) {
    console.error('Get labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/modules/labels
 * Body: { moduleId, name, color?, sortOrder? }
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth();
  const authResult = await auth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const userId = authResult;
  const tenantId = await getUserTenantId(userId);

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { moduleId, name, color, sortOrder } = body || {};

    if (!moduleId || !name || !uuidRegex.test(moduleId)) {
      return NextResponse.json({ error: 'moduleId and name are required' }, { status: 400 });
    }

    const moduleExists = await db.select().from(modules).where(eq(modules.id, moduleId)).limit(1);
    if (moduleExists.length === 0) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const [label] = await db
      .insert(moduleLabels)
      .values({
        tenantId,
        moduleId,
        name,
        color: color || '#3b82f6',
        sortOrder: sortOrder ?? 0,
      })
      .returning();

    return NextResponse.json({ success: true, data: label }, { status: 201 });
  } catch (error) {
    console.error('Create label error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/modules/labels
 * Body: { id, name?, color?, sortOrder?, isActive? }
 */
export async function PATCH(request: NextRequest) {
  const auth = requireAuth();
  const authResult = await auth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const userId = authResult;
  const tenantId = await getUserTenantId(userId);

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { id, name, color, sortOrder, isActive } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Partial<typeof moduleLabels.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db
      .update(moduleLabels)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(moduleLabels.id, id), eq(moduleLabels.tenantId, tenantId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update label error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/modules/labels
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  const auth = requireAuth();
  const authResult = await auth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const userId = authResult;
  const tenantId = await getUserTenantId(userId);

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { id } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const [deleted] = await db
      .delete(moduleLabels)
      .where(and(eq(moduleLabels.id, id), eq(moduleLabels.tenantId, tenantId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete label error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


