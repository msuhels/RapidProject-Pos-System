import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import { validateRequest } from '@/core/middleware/validation';
import { smtpTestSchema } from '@/core/lib/validations/settings';
import { getStoredSmtpSettings } from '@/core/lib/services/systemSettingsService';
import { verifyEmailConfig, sendEmailWithOverrides } from '@/core/lib/email';

/**
 * POST /api/settings/smtp/test
 * Test SMTP connectivity
 * Requires: settings:smtp-settings:update (testing is sensitive)
 */
export async function POST(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const hasPermission = await userHasPermission(userId, 'settings:smtp-settings:update');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateRequest(smtpTestSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const existing = await getStoredSmtpSettings();
    const merged = {
      ...existing,
      ...validation.data,
      password: validation.data.password ?? existing.password,
    };

    const ok = await verifyEmailConfig(merged);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'SMTP verification failed' },
        { status: 500 }
      );
    }

    if (validation.data.recipient) {
      await sendEmailWithOverrides(
        {
          to: validation.data.recipient,
          subject: 'SMTP Test Email',
          html: `<p>This is a test email from RAD Framework to confirm SMTP delivery.</p>`,
          text: 'This is a test email from RAD Framework to confirm SMTP delivery.',
        },
        merged
      );
    }

    return NextResponse.json({
      success: true,
      message: validation.data.recipient ? 'SMTP test email sent' : 'SMTP connection verified',
    });
  } catch (error) {
    console.error('[SMTP Settings] Test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

