import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { duplicateCart } from '../../services/cartService';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const record = await duplicateCart(params.id, tenantId, userId);

    if (!record) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Cart duplicate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

