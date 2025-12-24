import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import { validateRequest } from '@/core/middleware/validation';
import { smtpSettingsSchema, type SmtpSettingsInput } from '@/core/lib/validations/settings';
import {
  getStoredSmtpSettings,
  saveSmtpSettings,
} from '@/core/lib/services/systemSettingsService';

/**
 * GET /api/settings/smtp
 * Returns the stored SMTP configuration (password omitted)
 * Requires: settings:smtp-settings:read
 */
export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const hasPermission = await userHasPermission(userId, 'settings:smtp-settings:read');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await getStoredSmtpSettings();

    return NextResponse.json(
      {
        success: true,
        data: {
          host: settings.host || '',
          port: settings.port || 587,
          secure: settings.secure ?? false,
          user: settings.user || '',
          fromEmail: settings.fromEmail || '',
          fromName: settings.fromName || '',
          hasPassword: Boolean(settings.password),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SMTP Settings] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/settings/smtp
 * Update SMTP configuration
 * Requires: settings:smtp-settings:update
 */
export async function PUT(request: NextRequest) {
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
    const validation = validateRequest(smtpSettingsSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const existing = await getStoredSmtpSettings();
    const data = validation.data as SmtpSettingsInput & { password?: string };

    const passwordToSave = data.password ?? existing.password ?? '';

    await saveSmtpSettings({
      ...data,
      password: passwordToSave,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'SMTP settings updated',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SMTP Settings] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

