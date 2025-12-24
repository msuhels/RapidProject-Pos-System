import nodemailer from 'nodemailer';
import {
  getEffectiveSmtpSettings,
  type EffectiveSmtpSettings,
} from '@/core/lib/services/systemSettingsService';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type TransporterState = {
  transporter: nodemailer.Transporter | null;
  signature: string | null;
};

const transporterState: TransporterState = {
  transporter: null,
  signature: null,
};

function buildSignature(settings: EffectiveSmtpSettings): string {
  return JSON.stringify({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    user: settings.user,
  });
}

function formatFrom(settings: EffectiveSmtpSettings): string | undefined {
  if (!settings.fromEmail) {
    return undefined;
  }

  return settings.fromName ? `${settings.fromName} <${settings.fromEmail}>` : settings.fromEmail;
}

async function getTransporterWithConfig(overrides?: Partial<EffectiveSmtpSettings>) {
  const settings = await getEffectiveSmtpSettings(overrides);
  const signature = buildSignature(settings);

  if (!transporterState.transporter || transporterState.signature !== signature) {
    transporterState.transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: settings.user
        ? {
            user: settings.user,
            pass: settings.password,
          }
        : undefined,
    });
    transporterState.signature = signature;
  }

  const from = formatFrom(settings) || settings.user;

  return { transporter: transporterState.transporter, from };
}

/**
 * Send an email using the configured SMTP settings
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    const { transporter, from } = await getTransporterWithConfig();

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    });
    
    console.log(`[Email] Successfully sent email to ${options.to}`);
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send an email using provided SMTP overrides (used for testing)
 */
export async function sendEmailWithOverrides(
  options: SendEmailOptions,
  overrides?: Partial<EffectiveSmtpSettings>
): Promise<void> {
  try {
    const { transporter, from } = await getTransporterWithConfig(overrides);

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    console.log(`[Email] Test email sent to ${options.to}`);
  } catch (error) {
    console.error('[Email] Failed to send test email:', error);
    throw new Error('Failed to send test email');
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1a1a1a;
            font-size: 24px;
            margin: 0;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #0070f3;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            text-align: center;
          }
          .button:hover {
            background-color: #0051cc;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
          }
          .link {
            word-break: break-all;
            color: #0070f3;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          
          <div class="content">
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            
            <p>We received a request to reset your password for your SUBZERO SYSTEMS account. Click the button below to create a new password:</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p class="link">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>SUBZERO SYSTEMS Team</p>
            <p style="font-size: 12px; color: #999;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
Reset Your Password

Hello${userName ? ` ${userName}` : ''},

We received a request to reset your password for your SUBZERO SYSTEMS account.

To reset your password, please visit the following link:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
SUBZERO SYSTEMS Team
  `;
  
  await sendEmail({
    to: email,
    subject: 'Reset Your Password - SUBZERO SYSTEMS',
    html,
    text,
  });
}

/**
 * Send email verification email
 */
export async function sendEmailVerificationEmail(
  email: string,
  verificationToken: string,
  userName?: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email Address</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1a1a1a;
            font-size: 24px;
            margin: 0;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #10b981;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            text-align: center;
          }
          .button:hover {
            background-color: #059669;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
          }
          .info {
            background-color: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
          }
          .link {
            word-break: break-all;
            color: #0070f3;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Verify Your Email Address</h1>
          </div>
          
          <div class="content">
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            
            <p>Thank you for registering! To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            
            <div class="button-container">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p class="link">${verificationUrl}</p>
            
            <div class="info">
              <strong>⏱️ This verification link will expire in 24 hours.</strong>
            </div>
            
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    html,
  });
}

/**
 * Verify SMTP configuration
 */
export async function verifyEmailConfig(
  overrides?: Partial<EffectiveSmtpSettings>
): Promise<boolean> {
  try {
    const { transporter } = await getTransporterWithConfig(overrides);
    await transporter.verify();
    console.log('[Email] SMTP configuration verified successfully');
    return true;
  } catch (error) {
    console.error('[Email] SMTP configuration verification failed:', error);
    return false;
  }
}

