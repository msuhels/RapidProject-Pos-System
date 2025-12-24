import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { updateCustomTemplate } from '../../services/customTemplateService';

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } },
) {
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

    const { id } = context.params;
    const body = await request.json();

    const updated = await updateCustomTemplate({
      id,
      tenantId,
      userId,
      data: body,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('Custom template update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


