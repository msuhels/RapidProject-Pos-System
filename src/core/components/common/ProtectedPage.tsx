'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useAuthStore } from '@/core/store/authStore';
import { PageHeader } from './PageHeader';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedPageProps {
  children: ReactNode;
  permission: string | string[];
  requireAll?: boolean;
  title?: string;
  description?: string;
  fallbackPath?: string;
  showLoader?: boolean;
}

/**
 * Component that protects entire pages based on permissions
 * Shows loading state, access denied message, or the actual content
 */
export function ProtectedPage({
  children,
  permission,
  requireAll = false,
  title,
  description,
  fallbackPath = '/dashboard',
  showLoader = true,
}: ProtectedPageProps) {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Redirect to login if not authenticated (use useEffect to avoid render-time navigation)
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Show loading state while hydrating or checking permissions
  if (!_hasHydrated || loading) {
    if (!showLoader) {
      // For pages that handle their own loading, still render the shell
      return (
        <div className="w-full">
          {title && <PageHeader title={title} description={description} />}
        </div>
      );
    }

    return (
      <div className="w-full">
        {title && <PageHeader title={title} description={description} />}
        <div className="flex items-center justify-center min-h-[260px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (redirect is handled in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Check permissions
  let hasAccess = false;
  if (Array.isArray(permission)) {
    hasAccess = requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission);
  } else {
    hasAccess = hasPermission(permission);
  }

  // Show access denied if no permission
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-6 px-4">
        {title && <PageHeader title={title} description={description} />}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500 mb-4">
              You do not have permission to access this page.
            </p>
            <button
              onClick={() => router.push(fallbackPath)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User has access, render the page
  return <>{children}</>;
}

