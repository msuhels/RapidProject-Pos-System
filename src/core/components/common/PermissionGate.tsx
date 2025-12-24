'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/core/hooks/usePermissions';

interface PermissionGateProps {
  children: ReactNode;
  permission: string | string[];
  fallback?: ReactNode;
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * @example
 * <PermissionGate permission="users:create">
 *   <Button>Add User</Button>
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate permission={["users:update", "users:delete"]} requireAll={false}>
 *   <Button>Edit or Delete</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  fallback = null,
  requireAll = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (Array.isArray(permission)) {
    hasAccess = requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission);
  } else {
    hasAccess = hasPermission(permission);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check permissions and get permission-based props
 * Useful for conditional rendering in components
 */
export function usePermissionProps(module: string) {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(`${module}:read`),
    canCreate: hasPermission(`${module}:create`),
    canUpdate: hasPermission(`${module}:update`),
    canDelete: hasPermission(`${module}:delete`),
    canManage: hasPermission(`${module}:manage`),
    hasPermission,
  };
}

