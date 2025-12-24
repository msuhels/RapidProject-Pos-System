import { z } from 'zod';

// SMTP settings validation
export const smtpSettingsSchema = z.object({
  host: z.string().trim().min(1, 'SMTP host is required'),
  port: z
    .coerce.number({
      invalid_type_error: 'Port must be a number',
    })
    .int('Port must be an integer')
    .positive('Port must be greater than 0'),
  secure: z.boolean().default(false),
  user: z.string().trim().min(1, 'Username is required').optional(),
  password: z
    .preprocess((val) => (val === '' || val === null ? undefined : val), z.string().optional()),
  fromEmail: z
    .preprocess((val) => (val === '' || val === null ? undefined : val), z.string().email('Invalid sender email').optional()),
  fromName: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().max(255, 'Sender name is too long').optional()),
});

export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;

export const smtpTestSchema = smtpSettingsSchema.extend({
  recipient: z
    .preprocess((val) => (val === '' || val === null ? undefined : val), z.string().email('Invalid recipient email'))
    .optional(),
});

