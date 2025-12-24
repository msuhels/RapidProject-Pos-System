'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/authStore';

/**
 * Hook to check user permissions on the frontend
 * Uses cached permissions from auth store to avoid redundant API calls
 */
export function usePermissions() {
  const { user, isAuthenticated, token, permissions: cachedPermissions, permissionsLoaded, setPermissions } = useAuthStore();
  const [loading, setLoading] = useState(!permissionsLoaded);

  useEffect(() => {
    // If permissions are already loaded, use cached values (even if empty array)
    if (permissionsLoaded) {
      setLoading(false);
      return;
    }

    // Only fetch if authenticated and permissions not loaded
    if (!isAuthenticated || !user?.id || !token) {
      setLoading(false);
      return;
    }

    // Fetch permissions only once
    async function fetchPermissions() {
      try {
        const response = await fetch('/api/auth/permissions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const permissions = data.permissions || [];
          // Cache permissions in store
          setPermissions(permissions);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [isAuthenticated, user?.id, token, permissionsLoaded, setPermissions]);

  /**
   * Check if user has a specific permission
   * Supports wildcard matching (e.g., users:* matches users:create)
   */
  const hasPermission = (permissionCode: string): boolean => {
    const permissions = cachedPermissions;
    if (!isAuthenticated || permissions.length === 0) {
      return false;
    }

    // Check for exact match
    if (permissions.includes(permissionCode)) {
      return true;
    }

    // Check for wildcard match (e.g., users:* matches users:create)
    const module = permissionCode.split(':')[0];
    const wildcardPermission = `${module}:*`;
    if (permissions.includes(wildcardPermission)) {
      return true;
    }

    // Check for admin wildcard (admin:* grants everything)
    if (permissions.includes('admin:*')) {
      return true;
    }

    return false;
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    return permissionCodes.some((code) => hasPermission(code));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    return permissionCodes.every((code) => hasPermission(code));
  };

  return {
    permissions: cachedPermissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
