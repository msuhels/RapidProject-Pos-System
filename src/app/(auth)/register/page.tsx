'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { useAuthStore } from '@/core/store/authStore';
import { registerSchema, type RegisterInput } from '@/core/lib/validations/auth';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [formData, setFormData] = useState<RegisterInput>({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof RegisterInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const validateForm = (): boolean => {
    const result = registerSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Partial<Record<keyof RegisterInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0] as keyof RegisterInput] = error.message;
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Redirect to login with a flag so we can show the verification message there
      const emailParam = encodeURIComponent(formData.email);
      router.push(`/login?registered=1&email=${emailParam}`);
    } catch (error) {
      console.error('Registration error:', error);
      setApiError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/90">
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <Input
              id="name"
              name="name"
              type="text"
              label="Full name"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter your full name"
            />
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
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password (min 6 characters)"
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
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
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
