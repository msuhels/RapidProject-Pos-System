'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/core/components/common/PageHeader';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { toast } from 'sonner';
import { useAuthStore } from '@/core/store/authStore';

type FormState = {
  host: string;
  port: string;
  secure: 'true' | 'false';
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  hasPassword: boolean;
};

const initialState: FormState = {
  host: '',
  port: '587',
  secure: 'false',
  user: '',
  password: '',
  fromEmail: '',
  fromName: '',
  hasPassword: false,
};

export function SmtpSettingsForm() {
  const { token } = useAuthStore();
  const [form, setForm] = useState<FormState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings/smtp', {
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load SMTP settings');
        }

        const result = await response.json();
        const data = result.data || {};

        setForm((prev) => ({
          ...prev,
          host: data.host || '',
          port: String(data.port ?? '587'),
          secure: data.secure ? 'true' : 'false',
          user: data.user || '',
          fromEmail: data.fromEmail || '',
          fromName: data.fromName || '',
          hasPassword: Boolean(data.hasPassword),
          password: '',
        }));
      } catch (error) {
        console.error('[SMTP Settings] Load error:', error);
        toast.error('Unable to load SMTP settings');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [headers, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    host: form.host,
    port: Number(form.port) || 587,
    secure: form.secure === 'true',
    user: form.user || undefined,
    password: form.password || undefined,
    fromEmail: form.fromEmail || undefined,
    fromName: form.fromName || undefined,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/smtp', {
        method: 'PUT',
        headers,
        body: JSON.stringify(buildPayload()),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings');
      }

      toast.success('SMTP settings saved');
      setForm((prev) => ({
        ...prev,
        password: '',
        hasPassword: Boolean(prev.password || prev.hasPassword),
      }));
    } catch (error) {
      console.error('[SMTP Settings] Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers,
        body: JSON.stringify(buildPayload()),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'SMTP test failed');
      }

      toast.success('SMTP connection verified');
    } catch (error) {
      console.error('[SMTP Settings] Test error:', error);
      toast.error(error instanceof Error ? error.message : 'SMTP test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient.trim()) {
      toast.error('Please enter a recipient email');
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const response = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...buildPayload(),
          recipient: testRecipient.trim(),
        }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send test email');
      }

      toast.success('Test email sent');
    } catch (error) {
      console.error('[SMTP Settings] Test email error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send test email');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  return (
    <ProtectedPage
      permission="settings:smtp-settings:read"
      title="SMTP Settings"
      description="Manage the email server configuration used for system notifications."
    >
      <PageHeader
        title="SMTP Settings"
        description="Manage the email server configuration used for system notifications."
      />

      <Card className="mt-4">
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSave}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="SMTP Host"
                name="host"
                value={form.host}
                onChange={handleChange}
                required
                placeholder="smtp.example.com"
                disabled={isLoading || isSaving}
              />

              <Input
                label="Port"
                name="port"
                type="number"
                value={form.port}
                onChange={handleChange}
                required
                placeholder="587"
                disabled={isLoading || isSaving}
              />

              <Select
                label="Security"
                name="secure"
                value={form.secure}
                onChange={handleChange}
                disabled={isLoading || isSaving}
                options={[
                  { value: 'false', label: 'STARTTLS (recommended for 587)' },
                  { value: 'true', label: 'SSL/TLS (usually 465)' },
                ]}
              />

              <Input
                label="Username"
                name="user"
                value={form.user}
                onChange={handleChange}
                placeholder="noreply@example.com"
                disabled={isLoading || isSaving}
              />

              <Input
                label={`Password${form.hasPassword ? ' (leave blank to keep current)' : ''}`}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={form.hasPassword ? '••••••••' : 'Your SMTP password'}
                disabled={isLoading || isSaving}
              />

              <Input
                label="From Email"
                name="fromEmail"
                value={form.fromEmail}
                onChange={handleChange}
                placeholder="noreply@example.com"
                disabled={isLoading || isSaving}
              />

              <Input
                label="From Name"
                name="fromName"
                value={form.fromName}
                onChange={handleChange}
                placeholder="System Notifications"
                disabled={isLoading || isSaving}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isLoading || isSaving || isTesting}
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button type="submit" disabled={isLoading || isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Send Test Email</h3>
              <p className="text-sm text-muted-foreground">
                Send a test email to verify delivery with the current configuration.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
            <Input
              label="Recipient Email"
              name="testRecipient"
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading || isSaving || isSendingTestEmail}
              required
            />
            <Button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isLoading || isSaving || isSendingTestEmail}
            >
              {isSendingTestEmail ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}

