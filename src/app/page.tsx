'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/store/authStore';

/**
 * Root page - redirects to login or first accessible route based on auth state
 */
export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { token } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If authenticated, get the first accessible route from navigation API
    const getAccessibleRoute = async () => {
      try {
        const response = await fetch('/api/modules/navigation', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.navigation && data.navigation.length > 0) {
            // Get the first accessible route (navigation is already filtered by permissions)
            const firstRoute = data.navigation[0]?.path || '/dashboard';
            router.push(firstRoute);
            return;
          }
        }
      } catch (error) {
        console.error('[HomePage] Error fetching accessible route:', error);
      }

      // Fallback to dashboard if API fails
      router.push('/dashboard');
    };

    getAccessibleRoute();
  }, [isAuthenticated, router, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}

