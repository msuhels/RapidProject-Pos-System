'use client';

import { Lock, Shield, Key } from 'lucide-react';
import { Button } from '@/core/components/ui/button';

interface SecurityTabProps {
  onChangePassword: () => void;
}

export function SecurityTab({ onChangePassword }: SecurityTabProps) {
  return (
    <div className="space-y-6">
      {/* Change Password Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Password</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Update your password regularly to keep your account secure. We recommend using a strong password that you don't use elsewhere.
            </p>
            <Button onClick={onChangePassword} variant="outline">
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                Not Enabled
              </span>
              <Button variant="outline" size="sm" disabled>
                Enable 2FA (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your active sessions across different devices and browsers.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">Current Session</p>
              <p className="text-xs text-muted-foreground">Windows • Chrome • Last active: Now</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Account Security Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-3">Security Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>Use a unique password that you don't use for other accounts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>Enable two-factor authentication for additional security</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>Change your password regularly, at least every 90 days</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>Never share your password with anyone</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

