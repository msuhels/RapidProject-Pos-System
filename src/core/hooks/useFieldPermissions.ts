import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/core/store/authStore';

export interface FieldPermissionData {
  fieldCode: string;
  fieldName: string;
  fieldLabel: string;
  isVisible: boolean;
  isEditable: boolean;
}

export interface ModuleFieldPermissions {
  moduleCode: string;
  moduleName: string;
  fields: FieldPermissionData[];
}

/**
 * Hook to fetch and manage field-level permissions for the current user
 * @param moduleCode - Optional module code to filter permissions
 */
export function useFieldPermissions(moduleCode?: string) {
  const { token, isAuthenticated, user } = useAuthStore();
  const [fieldPermissions, setFieldPermissions] = useState<ModuleFieldPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFieldPermissions = useCallback(async () => {
    if (!isAuthenticated || !token || !user) {
      setFieldPermissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = moduleCode
        ? `/api/auth/field-permissions?moduleCode=${encodeURIComponent(moduleCode)}`
        : '/api/auth/field-permissions';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch field permissions');
      }

      const result = await response.json();
      
      if (result.success) {
        setFieldPermissions(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch field permissions');
      }
    } catch (err) {
      console.error('Error fetching field permissions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setFieldPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, user, moduleCode]);

  useEffect(() => {
    fetchFieldPermissions();
  }, [fetchFieldPermissions]);

  /**
   * Get field permissions for a specific module
   */
  const getModuleFieldPermissions = useCallback(
    (moduleCode: string): ModuleFieldPermissions | null => {
      return fieldPermissions.find(
        (m) => m.moduleCode.toLowerCase() === moduleCode.toLowerCase()
      ) || null;
    },
    [fieldPermissions]
  );

  /**
   * Check if a field is visible
   */
  const isFieldVisible = useCallback(
    (moduleCode: string, fieldCode: string): boolean => {
      const modulePerms = getModuleFieldPermissions(moduleCode);
      if (!modulePerms) return false;
      
      const field = modulePerms.fields.find(
        (f) => f.fieldCode.toLowerCase() === fieldCode.toLowerCase()
      );
      
      return field?.isVisible || false;
    },
    [getModuleFieldPermissions]
  );

  /**
   * Check if a field is editable
   */
  const isFieldEditable = useCallback(
    (moduleCode: string, fieldCode: string): boolean => {
      const modulePerms = getModuleFieldPermissions(moduleCode);
      if (!modulePerms) return false;
      
      const field = modulePerms.fields.find(
        (f) => f.fieldCode.toLowerCase() === fieldCode.toLowerCase()
      );
      
      return field?.isEditable || false;
    },
    [getModuleFieldPermissions]
  );

  /**
   * Get all visible fields for a module
   */
  const getVisibleFields = useCallback(
    (moduleCode: string): FieldPermissionData[] => {
      const modulePerms = getModuleFieldPermissions(moduleCode);
      if (!modulePerms) return [];
      
      return modulePerms.fields.filter((f) => f.isVisible);
    },
    [getModuleFieldPermissions]
  );

  /**
   * Get all editable fields for a module
   */
  const getEditableFields = useCallback(
    (moduleCode: string): FieldPermissionData[] => {
      const modulePerms = getModuleFieldPermissions(moduleCode);
      if (!modulePerms) return [];
      
      return modulePerms.fields.filter((f) => f.isEditable);
    },
    [getModuleFieldPermissions]
  );

  return {
    fieldPermissions,
    loading,
    error,
    refetch: fetchFieldPermissions,
    getModuleFieldPermissions,
    isFieldVisible,
    isFieldEditable,
    getVisibleFields,
    getEditableFields,
  };
}

