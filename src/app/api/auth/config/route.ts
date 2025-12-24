import { NextResponse } from 'next/server';
import { getAuthConfig } from '@/core/config/authConfig';

/**
 * GET /api/auth/config
 * Returns auth configuration for client-side use
 */
export async function GET() {
  try {
    const config = getAuthConfig();
    
    // Only return UI-relevant config (hide sensitive settings)
    return NextResponse.json({
      registration: {
        enabled: config.registration.enabled,
        showOnLoginPage: config.registration.showOnLoginPage,
      },
      ui: {
        showRegisterLink: config.ui.showRegisterLink,
        showForgotPasswordLink: config.ui.showForgotPasswordLink,
      },
    });
  } catch (error) {
    console.error('Failed to load auth config:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}

