import { db } from '@/core/lib/db';
import { systemSettings } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';
import type { SmtpSettingsInput } from '@/core/lib/validations/settings';

export interface StoredSystemSetting {
  settingKey: string;
  settingValue: string;
  category: string;
  subcategory: string | null;
  autoload: boolean;
  dataType: string | null;
  description: string | null;
  isSensitive: boolean;
}

export interface StoredSmtpSettings {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface EffectiveSmtpSettings extends StoredSmtpSettings {
  host: string;
  port: number;
  secure: boolean;
}

const SMTP_CATEGORY = 'smtp';

export async function getSystemSettingsByCategory(category: string): Promise<StoredSystemSetting[]> {
  const rows = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.category, category));

  return rows.map((row) => ({
    settingKey: row.settingKey,
    settingValue: row.settingValue,
    category: row.category,
    subcategory: row.subcategory ?? null,
    autoload: row.autoload,
    dataType: row.dataType,
    description: row.description,
    isSensitive: row.isSensitive,
  }));
}

export async function upsertSystemSettings(
  category: string,
  settings: Array<{
    key: string;
    value: string;
    subcategory?: string | null;
    autoload?: boolean;
    dataType?: string | null;
    description?: string | null;
    isSensitive?: boolean;
  }>
): Promise<void> {
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const setting of settings) {
      await tx
        .insert(systemSettings)
        .values({
          settingKey: setting.key,
          settingValue: setting.value,
          category,
          subcategory: setting.subcategory ?? null,
          autoload: setting.autoload ?? true,
          dataType: setting.dataType ?? 'string',
          description: setting.description ?? null,
          isSensitive: setting.isSensitive ?? false,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: systemSettings.settingKey,
          set: {
            settingValue: setting.value,
            category,
            subcategory: setting.subcategory ?? null,
            autoload: setting.autoload ?? true,
            dataType: setting.dataType ?? 'string',
            description: setting.description ?? null,
            isSensitive: setting.isSensitive ?? false,
            updatedAt: now,
          },
        });
    }
  });
}

export async function getStoredSmtpSettings(): Promise<StoredSmtpSettings> {
  const settings = await getSystemSettingsByCategory(SMTP_CATEGORY);

  const map = settings.reduce<Record<string, string>>((acc, setting) => {
    acc[setting.settingKey] = setting.settingValue;
    return acc;
  }, {});

  const secure = map['smtp.secure'];

  return {
    host: map['smtp.host'],
    port: map['smtp.port'] ? parseInt(map['smtp.port'], 10) : undefined,
    secure: secure === undefined ? undefined : secure === 'true',
    user: map['smtp.user'],
    password: map['smtp.password'],
    fromEmail: map['smtp.fromEmail'],
    fromName: map['smtp.fromName'],
  };
}

export async function saveSmtpSettings(input: SmtpSettingsInput & { password?: string }): Promise<void> {
  await upsertSystemSettings(SMTP_CATEGORY, [
    {
      key: 'smtp.host',
      value: input.host,
      description: 'SMTP host',
    },
    {
      key: 'smtp.port',
      value: input.port.toString(),
      dataType: 'number',
      description: 'SMTP port',
    },
    {
      key: 'smtp.secure',
      value: String(input.secure),
      dataType: 'boolean',
      description: 'Use secure connection (SSL/TLS)',
    },
    {
      key: 'smtp.user',
      value: input.user ?? '',
      description: 'SMTP username',
      isSensitive: true,
    },
    {
      key: 'smtp.password',
      value: input.password ?? '',
      description: 'SMTP password',
      isSensitive: true,
    },
    {
      key: 'smtp.fromEmail',
      value: input.fromEmail ?? '',
      description: 'Default from email',
    },
    {
      key: 'smtp.fromName',
      value: input.fromName ?? '',
      description: 'Default from name',
    },
  ]);
}

export async function getEffectiveSmtpSettings(
  overrides: Partial<StoredSmtpSettings> = {}
): Promise<EffectiveSmtpSettings> {
  const envFallback: StoredSmtpSettings = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER,
    fromName: process.env.SMTP_FROM_NAME,
  };

  const stored = await getStoredSmtpSettings();
  const merged: EffectiveSmtpSettings = {
    host: overrides.host ?? stored.host ?? envFallback.host ?? 'smtp.gmail.com',
    port: overrides.port ?? stored.port ?? envFallback.port ?? 587,
    secure: overrides.secure ?? stored.secure ?? envFallback.secure ?? false,
    user: overrides.user ?? stored.user ?? envFallback.user,
    password: overrides.password ?? stored.password ?? envFallback.password,
    fromEmail: overrides.fromEmail ?? stored.fromEmail ?? envFallback.fromEmail,
    fromName: overrides.fromName ?? stored.fromName ?? envFallback.fromName,
  };

  return merged;
}

