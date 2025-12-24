'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/core/lib/validations/auth';

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordInput>({
    email: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ForgotPasswordInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ForgotPasswordInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const validateForm = (): boolean => {
    const result = forgotPasswordSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Partial<Record<keyof ForgotPasswordInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0] as keyof ForgotPasswordInput] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || 'Failed to send reset email');
        setIsLoading(false);
        return;
      }

      // Show success message
      setSuccessMessage(data.message || 'Password reset email sent successfully!');
      setFormData({ email: '' }); // Clear form
      setIsLoading(false);
    } catch (error) {
      console.error('Forgot password error:', error);
      setApiError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-foreground">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {successMessage ? (
          <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800 dark:text-green-400">{successMessage}</p>
                <p className="mt-2 text-sm text-green-700 dark:text-green-500">
                  Please check your email inbox (and spam folder) for the reset link.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/login"
                className="text-sm font-medium text-green-800 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                Return to login →
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
              />
            </div>

            {apiError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:text-primary/90"
              >
                ← Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

