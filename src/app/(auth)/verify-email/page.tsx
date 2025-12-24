'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/core/components/ui/button';

type Status = 'idle' | 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  // Wrap the search params usage in a Suspense boundary to satisfy Next.js
  // when prerendering / exporting this route.
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // If there is no token, show error immediately
    if (!token) {
      setStatus('error');
      setMessage('Verification link is invalid. No token was provided.');
      return;
    }

    const verifyEmail = async () => {
      setStatus('verifying');
      setMessage('Verifying your email address. Please wait...');

      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: 'GET',
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'Verification link is invalid or has expired.');
          return;
        }

        setStatus('success');
        setMessage(data.message || 'Email verified successfully! You can now sign in.');
      } catch (error) {
        console.error('[VerifyEmailPage] Verification error:', error);
        setStatus('error');
        setMessage('Something went wrong while verifying your email. Please try again.');
      }
    };

    void verifyEmail();
  }, [token]);

  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Email verification
          </h1>
          {status === 'verifying' && (
            <p className="text-sm text-muted-foreground">
              We are verifying your email address. This will only take a moment.
            </p>
          )}
          {status !== 'verifying' && (
            <p className="text-sm text-muted-foreground">
              {status === 'success'
                ? 'Your email has been verified successfully.'
                : 'We could not verify your email with this link.'}
            </p>
          )}
        </div>

        <div
          className={[
            'rounded-md border p-4 text-sm',
            status === 'success'
              ? 'border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
              : status === 'verifying'
              ? 'border-blue-500/50 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
              : 'border-red-500/50 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200',
          ].join(' ')}
        >
          <p>{message}</p>
        </div>

        <div className="space-y-3">
          {status === 'success' && (
            <Button className="w-full" onClick={handleGoToLogin}>
              Go to sign in
            </Button>
          )}

          {status === 'error' && (
            <p className="text-xs text-center text-muted-foreground">
              If your link has expired, you can request a new one from the{' '}
              <Link href="/login" className="text-primary underline-offset-2 hover:underline">
                sign in
              </Link>{' '}
              page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
